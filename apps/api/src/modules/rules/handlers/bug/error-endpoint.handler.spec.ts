import { AnalysisSchema, RuleType, SubjectType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Rule } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type BugEventFixture, bugEventLine } from '../../../files/bug-log.fixtures';
import { createSubject } from '../../../subjects/subject';
import { ErrorEndpointHandler } from './error-endpoint.handler';

describe('ErrorEndpointHandler', () => {
  let dir: string;
  let errorEndpointHandler: ErrorEndpointHandler;

  const rule = (config: object = { minCount: 2 }) => ({ id: 'r-1', type: RuleType.ERROR_ENDPOINT, config }) as Rule;
  const context = (): ApiAnalysisContext => ({ schema: AnalysisSchema.BUG, logPath: join(dir, 'bug_log.log') });

  const writeLog = (events: BugEventFixture[]) => writeFile(join(dir, 'bug_log.log'), events.map(bugEventLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'error-endpoint-'));
    errorEndpointHandler = new ErrorEndpointHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one issue per endpoint raising at least the min count, most errors first', async () => {
    await writeLog([
      { method: 'POST', route: '/api/process/{id}', status: 500 },
      { method: 'POST', route: '/api/process/{id}', status: 500 },
      { method: 'POST', route: '/api/process/{id}', status: 404 },
      { route: '/.env', status: 404 },
      { route: '/.env' },
      { route: '/favicon.ico' },
      {},
      {},
    ]);

    await expect(errorEndpointHandler.handle(rule(), context())).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: '3 errors raised, 2 with a 5xx status',
        subject: createSubject(SubjectType.API, 'POST /api/process/{id}'),
      },
      { ruleId: 'r-1', description: '2 errors raised, 0 with a 5xx status', subject: createSubject(SubjectType.API, '/.env') },
    ]);
  });

  it('reports nothing without a min count', async () => {
    await writeLog([{ route: '/a' }]);

    await expect(errorEndpointHandler.handle(rule({}), context())).resolves.toEqual([]);
  });
});
