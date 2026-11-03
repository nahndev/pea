import { AnalysisSchema, MetricType, SubjectType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Metric } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type ApiRequestFixture, apiRequestLine } from '../../../files/api-metric.fixtures';
import { createSubject } from '../../../subjects/subject';
import { EndpointPercentileHandler } from './endpoint-percentile.handler';

describe('EndpointPercentileHandler', () => {
  let dir: string;
  let endpointPercentileHandler: EndpointPercentileHandler;

  const metric = (type: string = MetricType.ENDPOINT_P95) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const context = (): ApiAnalysisContext => ({ schema: AnalysisSchema.API, logPath: join(dir, 'api_metric.log') });

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(apiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'endpoint-percentile-'));
    endpointPercentileHandler = new EndpointPercentileHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one measurement per endpoint, slowest first', async () => {
    await writeLog([
      { durationMs: 100, route: '/api/cart' },
      { durationMs: 200, route: '/api/cart' },
      { durationMs: 900, method: 'POST', route: '/api/checkout' },
      { durationMs: 1000, method: 'POST', route: '/api/checkout' },
      { durationMs: 10, route: '/api/orders' },
    ]);

    const measurements = await endpointPercentileHandler.handle(metric(), context());

    expect(measurements.map(({ subject }) => subject?.description)).toEqual(['POST /api/checkout', 'GET /api/cart', 'GET /api/orders']);
    expect(measurements[0].subject).toEqual(createSubject(SubjectType.API, 'POST /api/checkout'));
    expect(measurements[0].value).toBeCloseTo(995);
    expect(measurements[1].value).toBeCloseTo(195);
    expect(measurements[2].value).toBeCloseTo(10);
  });

  it('returns no measurement for an empty log', async () => {
    await writeLog([]);
    await expect(endpointPercentileHandler.handle(metric(), context())).resolves.toEqual([]);
  });


  it('ignores a metric type without a percentile', async () => {
    await writeLog([{ durationMs: 1000 }]);
    await expect(endpointPercentileHandler.handle(metric('UNKNOWN'), context())).resolves.toEqual([]);
  });
});
