import { AnalysisSchema, RuleType, SubjectType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Rule } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type BugEventFixture, bugEventLine } from '../../../files/bug-log.fixtures';
import { createSubject } from '../../../subjects/subject';
import { ErrorGroupHandler } from './error-group.handler';

describe('ErrorGroupHandler', () => {
  let dir: string;
  let errorGroupHandler: ErrorGroupHandler;

  const rule = (type: RuleType, config: object = { minCount: 2 }) => ({ id: 'r-1', type, config }) as Rule;
  const context = (schema: ApiAnalysisContext['schema'] = AnalysisSchema.BUG): ApiAnalysisContext => ({
    schema,
    logPath: join(dir, 'bug_log.log'),
  });

  const writeLog = (events: BugEventFixture[]) => writeFile(join(dir, 'bug_log.log'), events.map(bugEventLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'error-group-'));
    errorGroupHandler = new ErrorGroupHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one issue per error group raised at least the min count, most frequent first', async () => {
    await writeLog([
      { type: 'NotFoundHttpException', location: 'src/A.php:1' },
      { type: 'NotFoundHttpException', location: 'src/A.php:1' },
      { type: 'NotFoundHttpException', location: 'src/A.php:1' },
      { type: 'NotFoundHttpException', location: 'src/B.php:2' },
      { type: 'API exception', message: 'API exception' },
      { type: 'API exception', message: 'API exception' },
    ]);

    await expect(errorGroupHandler.handle(rule(RuleType.FREQUENT_ERROR), context())).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'Raised 3 times: Not Found',
        subject: createSubject(SubjectType.ERROR, 'NotFoundHttpException at src/A.php:1'),
      },
      { ruleId: 'r-1', description: 'Raised 2 times: API exception', subject: createSubject(SubjectType.ERROR, 'API exception') },
    ]);
  });

  it('counts only critical events for CRITICAL_ERROR', async () => {
    await writeLog([
      { type: 'DeadlockException', level: 'CRITICAL', message: 'Deadlock detected' },
      { type: 'DeadlockException', level: 'ERROR' },
      { type: 'NotFoundHttpException', level: 'ERROR' },
    ]);

    await expect(errorGroupHandler.handle(rule(RuleType.CRITICAL_ERROR, { minCount: 1 }), context())).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: '1 critical occurrences: Deadlock detected',
        subject: createSubject(SubjectType.ERROR, 'DeadlockException'),
      },
    ]);
  });

  it('describes a group without message by its count only', async () => {
    await writeFile(join(dir, 'bug_log.log'), ['{"type":"x"}', '{"type":"x"}'].join('\n'));

    await expect(errorGroupHandler.handle(rule(RuleType.FREQUENT_ERROR), context())).resolves.toEqual([
      { ruleId: 'r-1', description: 'Raised 2 times', subject: createSubject(SubjectType.ERROR, 'x') },
    ]);
  });

  it('reports nothing for another schema or without a min count', async () => {
    await writeLog([{}, {}]);

    await expect(errorGroupHandler.handle(rule(RuleType.FREQUENT_ERROR), context(AnalysisSchema.API))).resolves.toEqual([]);
    await expect(errorGroupHandler.handle(rule(RuleType.FREQUENT_ERROR, {}), context())).resolves.toEqual([]);
  });
});
