import { MetricType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Analysis, Metric } from '../../../generated/client';
import { type ApiRequestFixture, apiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { EndpointPercentileHandler } from './endpoint-percentile.handler';

describe('EndpointPercentileHandler', () => {
  let dir: string;
  let endpointPercentileHandler: EndpointPercentileHandler;

  const metric = (type: string = MetricType.ENDPOINT_P95) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const analysis = { id: 'an-1', file: 'api_metric.log', path: 'api_metric.log' } as Analysis;

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(apiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'endpoint-percentile-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    endpointPercentileHandler = new EndpointPercentileHandler(storageService as unknown as StorageService);
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

    const measurements = await endpointPercentileHandler.handle(metric(), analysis);

    expect(measurements.map(({ subject }) => subject)).toEqual(['POST /api/checkout', 'GET /api/cart', 'GET /api/orders']);
    expect(measurements[0].value).toBeCloseTo(995);
    expect(measurements[1].value).toBeCloseTo(195);
    expect(measurements[2].value).toBeCloseTo(10);
  });

  it('returns no measurement for an empty log', async () => {
    await writeLog([]);
    await expect(endpointPercentileHandler.handle(metric(), analysis)).resolves.toEqual([]);
  });


  it('ignores a metric type without a percentile', async () => {
    await writeLog([{ durationMs: 1000 }]);
    await expect(endpointPercentileHandler.handle(metric('UNKNOWN'), analysis)).resolves.toEqual([]);
  });
});
