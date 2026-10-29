import { RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Analysis, Rule } from '../../../generated/client';
import { type ApiRequestFixture, apiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { RouteErrorRateHandler } from './route-error-rate.handler';

describe('RouteErrorRateHandler', () => {
  let dir: string;
  let routeErrorRateHandler: RouteErrorRateHandler;

  const rule = (config: object = { maxPercent: 10, minRequests: 2 }) =>
    ({ id: 'r-1', type: RuleType.ROUTE_ERROR_RATE, config }) as Rule;
  const analysis = { id: 'an-1', file: 'api_metric.log', path: 'api_metric.log' } as Analysis;

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(apiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'route-error-rate-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    routeErrorRateHandler = new RouteErrorRateHandler(storageService as unknown as StorageService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one issue per route whose 5xx rate exceeds the threshold, worst first', async () => {
    await writeLog([
      { durationMs: 10, route: '/api/cart', statusCode: 500 },
      { durationMs: 10, route: '/api/cart' },
      { durationMs: 10, route: '/api/cart' },
      { durationMs: 10, method: 'POST', route: '/api/checkout', statusCode: 503 },
      { durationMs: 10, method: 'POST', route: '/api/checkout', statusCode: 500 },
      { durationMs: 10, route: '/api/orders' },
      { durationMs: 10, route: '/api/orders' },
    ]);
    await expect(routeErrorRateHandler.handle(rule(), analysis)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'POST /api/checkout 5xx error rate 100.0% exceeds threshold 10%',
      },
      { ruleId: 'r-1', description: 'GET /api/cart 5xx error rate 33.3% exceeds threshold 10%' },
    ]);
  });

  it('skips routes with fewer requests than minRequests', async () => {
    await writeLog([{ durationMs: 10, statusCode: 500 }]);
    await expect(routeErrorRateHandler.handle(rule({ maxPercent: 10, minRequests: 2 }), analysis)).resolves.toEqual([]);
  });

  it('returns no issue when the rule has no threshold', async () => {
    await writeLog([{ durationMs: 10, statusCode: 500 }, { durationMs: 10, statusCode: 500 }]);
    await expect(routeErrorRateHandler.handle(rule({ minRequests: 1 }), analysis)).resolves.toEqual([]);
  });
});
