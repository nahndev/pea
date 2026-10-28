import { AnalysisContextType, MetricType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AnalysisContext, Metric } from '../../../generated/client';
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
      durations.map((duration_ms) => JSON.stringify({ duration_ms })).join('\n'),
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
    await expect(percentileHandler.handle(metric(type), context())).resolves.toBeCloseTo(expected);
  });

  it('returns null for an empty log', async () => {
    await writeLog([]);
    await expect(percentileHandler.handle(metric(), context())).resolves.toBeNull();
  });

  it('returns null for contexts that are not api metrics', async () => {
    await writeLog([1000]);
    await expect(percentileHandler.handle(metric(), context(AnalysisContextType.QUERY))).resolves.toBeNull();
  });

  it('returns null for a metric type without a percentile', async () => {
    await writeLog([1000]);
    await expect(percentileHandler.handle(metric('UNKNOWN'), context())).resolves.toBeNull();
  });
});
