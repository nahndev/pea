import { AnalysisContextType, MetricType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AnalysisContext, Metric } from '../../../generated/client';
import { apiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { PercentileHandler } from './percentile.handler';

describe('PercentileHandler', () => {
  let dir: string;
  let percentileHandler: PercentileHandler;

  const metric = (type: string = MetricType.P90) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const context = (type: string = AnalysisContextType.API_METRIC) =>
    ({ id: 'c-1', analysisId: 'an-1', file: 'api_metric.log', path: 'api_metric.log', type }) as AnalysisContext;

  const writeLog = (durations: number[]) =>
    writeFile(
      join(dir, 'api_metric.log'),
      durations.map((duration) => apiRequestLine({ durationMs: duration })).join('\n'),
    );

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'percentile-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    percentileHandler = new PercentileHandler(storageService as unknown as StorageService);
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

  it('returns no measurement for contexts that are not api metrics', async () => {
    await writeLog([1000]);
    await expect(percentileHandler.handle(metric(), context(AnalysisContextType.QUERY))).resolves.toEqual([]);
  });

  it('returns no measurement for a metric type without a percentile', async () => {
    await writeLog([1000]);
    await expect(percentileHandler.handle(metric('UNKNOWN'), context())).resolves.toEqual([]);
  });
});
