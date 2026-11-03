import { AnalysisSchema, MetricType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Metric } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { apiRequestLine } from '../../../files/api-metric.fixtures';
import { PercentileHandler } from './percentile.handler';

describe('PercentileHandler', () => {
  let dir: string;
  let percentileHandler: PercentileHandler;

  const metric = (type: string = MetricType.P90) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const context = (): ApiAnalysisContext => ({ schema: AnalysisSchema.API, logPath: join(dir, 'api_metric.log') });

  const writeLog = (durations: number[]) =>
    writeFile(
      join(dir, 'api_metric.log'),
      durations.map((duration) => apiRequestLine({ durationMs: duration })).join('\n'),
    );

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'percentile-'));
    percentileHandler = new PercentileHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it.each([
    [MetricType.P50, 55],
    [MetricType.P90, 91],
    [MetricType.P95, 95.5],
  ])('returns the %s of the durations', async (type, expected) => {
    await writeLog([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    const [measurement] = await percentileHandler.handle(metric(type), context());
    expect(measurement.value).toBeCloseTo(expected);
  });

  it('returns no measurement for an empty log', async () => {
    await writeLog([]);
    await expect(percentileHandler.handle(metric(), context())).resolves.toEqual([]);
  });

  it('ignores lines without a duration', async () => {
    await writeFile(
      join(dir, 'api_metric.log'),
      [apiRequestLine({ durationMs: 10 }), JSON.stringify({ method: 'GET', route: '/api/cart' })].join('\n'),
    );
    const [measurement] = await percentileHandler.handle(metric(MetricType.P90), context());
    expect(measurement.value).toBeCloseTo(10);
  });


  it('returns no measurement for a metric type without a percentile', async () => {
    await writeLog([1000]);
    await expect(percentileHandler.handle(metric('UNKNOWN'), context())).resolves.toEqual([]);
  });
});
