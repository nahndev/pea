import { AnalysisSchema, MetricType, SubjectType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Metric } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type BugEventFixture, bugEventLine } from '../../../files/bug-log.fixtures';
import { createSubject } from '../../../subjects/subject';
import { ErrorOccurrencesHandler } from './error-occurrences.handler';

describe('ErrorOccurrencesHandler', () => {
  let dir: string;
  let errorOccurrencesHandler: ErrorOccurrencesHandler;

  const metric = { id: 'm-1', type: MetricType.ERROR_OCCURRENCES, description: '', config: {} } as unknown as Metric;
  const context = (): ApiAnalysisContext => ({ schema: AnalysisSchema.BUG, logPath: join(dir, 'bug_log.log') });

  const writeLog = (events: BugEventFixture[]) => writeFile(join(dir, 'bug_log.log'), events.map(bugEventLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'error-occurrences-'));
    errorOccurrencesHandler = new ErrorOccurrencesHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('measures the occurrences of each error group, most frequent first', async () => {
    await writeLog([{ type: 'B' }, { type: 'A', location: 'src/A.php:1' }, { type: 'A', location: 'src/A.php:1' }]);

    await expect(errorOccurrencesHandler.handle(metric, context())).resolves.toEqual([
      { subject: createSubject(SubjectType.ERROR, 'A at src/A.php:1'), value: 2 },
      { subject: createSubject(SubjectType.ERROR, 'B'), value: 1 },
    ]);
  });
});
