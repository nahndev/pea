import { AnalysisSchema, RuleType, SubjectType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Rule } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type PageLoadFixture, pageLoadLine, pageOf } from '../../../files/frontend-metric.fixtures';
import { createSubject } from '../../../subjects/subject';
import { PageRuleHandler } from './page-rule.handler';

describe('PageRuleHandler', () => {
  let dir: string;
  let pageRuleHandler: PageRuleHandler;

  const rule = (type: string, config: object) => ({ id: 'r-1', type, config }) as Rule;
  const context = (schema: ApiAnalysisContext['schema'] = AnalysisSchema.FRONTEND): ApiAnalysisContext => ({
    schema,
    logPath: join(dir, 'frontend_metric.log'),
  });

  const writeLog = (loads: PageLoadFixture[]) => writeFile(join(dir, 'frontend_metric.log'), loads.map(pageLoadLine).join('\n'));

  const LOADS: PageLoadFixture[] = [
    { route: '/synthese/:id?', durationMs: 12000, visibleMs: 3700, requestCount: 58, longFrameMs: 3500 },
    { route: '/synthese/:id?', durationMs: 10000, visibleMs: 2300, requestCount: 53, longFrameMs: 3100 },
    { route: '/synthese/:id?', durationMs: 2000, status: 'aborted', requestCount: 9, longFrameMs: 400 },
    { route: '/groupe', durationMs: 1000, visibleMs: 60, requestCount: 2, longFrameMs: 100 },
    { route: '/groupe', durationMs: 1200, visibleMs: 80, requestCount: 3, longFrameMs: 120 },
    { route: '/tableau/:id', durationMs: 90000, status: 'aborted' },
  ];

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'page-rule-'));
    pageRuleHandler = new PageRuleHandler();
    await writeLog(LOADS);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('creates one issue per page above the threshold', async () => {
    await expect(pageRuleHandler.handle(rule(RuleType.SLOW_PAGE, { thresholdMs: 5000, minLoads: 2 }), context())).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'P95 load 11900.0ms exceeds threshold 5000ms',
        subject: createSubject(SubjectType.PAGE, pageOf('/synthese/:id?')),
      },
    ]);
  });

  it.each([
    [RuleType.SLOW_VISIBLE_PAGE, { thresholdMs: 2500 }, 'P95 visible after 3630.0ms exceeds threshold 2500ms'],
    [RuleType.LONG_FRAME_PAGE, { thresholdMs: 1000 }, 'P95 long frames 3460.0ms exceed threshold 1000ms'],
    [RuleType.CHATTY_PAGE, { maxRequests: 50 }, 'P95 57.5 requests per load exceeds 50'],
    [RuleType.ABORTED_PAGE, { maxPercent: 30 }, '33.3% of loads aborted, above 30%'],
  ])('describes %s', async (type, config, description) => {
    const issues = await pageRuleHandler.handle(rule(type, { ...config, minLoads: 2 }), context());
    expect(issues.map((issue) => [issue.subject?.description, issue.description])).toEqual([[pageOf('/synthese/:id?'), description]]);
  });

  it('ignores pages with fewer loads than the minimum', async () => {
    const issues = await pageRuleHandler.handle(rule(RuleType.ABORTED_PAGE, { maxPercent: 30, minLoads: 1 }), context());
    expect(issues.map(({ subject }) => subject?.description)).toEqual([pageOf('/tableau/:id'), pageOf('/synthese/:id?')]);
  });

  it('returns no issue for another schema, an unknown type or a missing config', async () => {
    await expect(pageRuleHandler.handle(rule(RuleType.SLOW_PAGE, { thresholdMs: 1, minLoads: 1 }), context(AnalysisSchema.API))).resolves.toEqual([]);
    await expect(pageRuleHandler.handle(rule('UNKNOWN', { thresholdMs: 1, minLoads: 1 }), context())).resolves.toEqual([]);
    await expect(pageRuleHandler.handle(rule(RuleType.SLOW_PAGE, { minLoads: 1 }), context())).resolves.toEqual([]);
    await expect(pageRuleHandler.handle(rule(RuleType.SLOW_PAGE, { thresholdMs: 1 }), context())).resolves.toEqual([]);
  });
});
