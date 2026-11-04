import { AnalysisSchema, MetricType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Metric } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type BugEventFixture, bugEventLine } from '../../../files/bug-log.fixtures';
import { ErrorCountHandler } from './error-count.handler';

describe('ErrorCountHandler', () => {
  let dir: string;
  let errorCountHandler: ErrorCountHandler;

  const metric = (type: string) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const context = (schema: ApiAnalysisContext['schema'] = AnalysisSchema.BUG): ApiAnalysisContext => ({
    schema,
    logPath: join(dir, 'bug_log.log'),
  });

  const writeLog = (events: BugEventFixture[]) => writeFile(join(dir, 'bug_log.log'), events.map(bugEventLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'error-count-'));
    errorCountHandler = new ErrorCountHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it.each([
    [MetricType.ERROR_COUNT, 4],
    [MetricType.CRITICAL_ERROR_COUNT, 2],
    [MetricType.ERROR_GROUP_COUNT, 3],
  ])('measures %s', async (type, expected) => {
    await writeLog([
      { type: 'A', level: 'CRITICAL' },
      { type: 'A', level: 'ERROR' },
      { type: 'A', location: 'src/A.php:1', level: 'ALERT' },
      { type: 'B' },
    ]);

    await expect(errorCountHandler.handle(metric(type), context())).resolves.toEqual([{ value: expected }]);
  });

  it('measures 0 for an empty log', async () => {
    await writeLog([]);

    await expect(errorCountHandler.handle(metric(MetricType.ERROR_COUNT), context())).resolves.toEqual([{ value: 0 }]);
  });

  it('measures nothing for another schema or metric type', async () => {
    await writeLog([{}]);

    await expect(errorCountHandler.handle(metric(MetricType.ERROR_COUNT), context(AnalysisSchema.API))).resolves.toEqual([]);
    await expect(errorCountHandler.handle(metric(MetricType.P50), context())).resolves.toEqual([]);
  });
});
