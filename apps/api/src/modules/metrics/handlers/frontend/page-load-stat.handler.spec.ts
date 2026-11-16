import { AnalysisSchema, MetricType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Metric } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type PageLoadFixture, pageLoadLine } from '../../../files/frontend-metric.fixtures';
import { PageLoadStatHandler } from './page-load-stat.handler';

describe('PageLoadStatHandler', () => {
  let dir: string;
  let pageLoadStatHandler: PageLoadStatHandler;

  const metric = (type: string) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const context = (schema: ApiAnalysisContext['schema'] = AnalysisSchema.FRONTEND): ApiAnalysisContext => ({
    schema,
    logPath: join(dir, 'frontend_metric.log'),
  });

  const writeLog = (loads: PageLoadFixture[]) => writeFile(join(dir, 'frontend_metric.log'), loads.map(pageLoadLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'page-load-stat-'));
    pageLoadStatHandler = new PageLoadStatHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it.each([
    [MetricType.PAGE_LOAD_COUNT, 4],
    [MetricType.ABORTED_PAGE_LOAD_RATE, 25],
    [MetricType.VISIBLE_P95, 190],
    [MetricType.LONG_FRAME_P95, 270],
    [MetricType.REQUEST_COUNT_P95, 37],
  ])('measures %s', async (type, expected) => {
    await writeLog([
      { durationMs: 100, visibleMs: 100, requestCount: 10, longFrameMs: 0 },
      { durationMs: 200, visibleMs: 200, requestCount: 40, longFrameMs: 300 },
      { durationMs: 5000, visibleMs: 5000, status: 'aborted', requestCount: 20, longFrameMs: 100 },
      { durationMs: 50, visibleMs: 50, requestCount: 1, longFrameMs: 0 },
    ]);

    const [measurement] = await pageLoadStatHandler.handle(metric(type), context());
    expect(measurement.value).toBeCloseTo(expected);
  });

  it.each([
    [MetricType.FROM_ROUTE_P50, 2000],
    [MetricType.FROM_ROUTE_P90, 2800],
    [MetricType.FROM_ROUTE_P95, 2900],
  ])('measures %s on loads from another route only', async (type, expected) => {
    await writeLog([
      { durationMs: 9000 },
      { durationMs: 1000, previousRoute: '/agenda' },
      { durationMs: 2000, previousRoute: '/agenda' },
      { durationMs: 3000, previousRoute: '/groupe' },
      { durationMs: 90000, previousRoute: '/groupe', status: 'aborted' },
    ]);

    const [measurement] = await pageLoadStatHandler.handle(metric(type), context());
    expect(measurement.value).toBeCloseTo(expected);
  });

  it('measures no percentile from another route when every load is a first load', async () => {
    await writeLog([{ durationMs: 9000 }]);

    await expect(pageLoadStatHandler.handle(metric(MetricType.FROM_ROUTE_P95), context())).resolves.toEqual([]);
  });

  it('counts 0 page loads and measures nothing else for an empty log', async () => {
    await writeLog([]);

    await expect(pageLoadStatHandler.handle(metric(MetricType.PAGE_LOAD_COUNT), context())).resolves.toEqual([{ value: 0 }]);
    await expect(pageLoadStatHandler.handle(metric(MetricType.VISIBLE_P95), context())).resolves.toEqual([]);
  });

  it('measures nothing for another schema or metric type', async () => {
    await writeLog([{ durationMs: 100 }]);

    await expect(pageLoadStatHandler.handle(metric(MetricType.PAGE_LOAD_COUNT), context(AnalysisSchema.API))).resolves.toEqual([]);
    await expect(pageLoadStatHandler.handle(metric(MetricType.P50), context())).resolves.toEqual([]);
  });
});
