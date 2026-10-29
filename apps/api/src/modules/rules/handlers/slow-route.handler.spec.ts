import { RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Analysis, Rule } from '../../../generated/client';
import { type ApiRequestFixture, apiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { SlowRouteHandler } from './slow-route.handler';

describe('SlowRouteHandler', () => {
  let dir: string;
  let slowRouteHandler: SlowRouteHandler;

  const rule = (config: object = { thresholdMs: 100, minRequests: 2 }) =>
    ({ id: 'r-1', type: RuleType.SLOW_ROUTE, config }) as Rule;
  const analysis = { id: 'an-1', file: 'api_metric.log', path: 'api_metric.log' } as Analysis;

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(apiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'slow-route-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    slowRouteHandler = new SlowRouteHandler(storageService as unknown as StorageService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one issue per route whose p95 exceeds the threshold, slowest first', async () => {
    await writeLog([
      { durationMs: 500, route: '/api/cart' },
      { durationMs: 600, route: '/api/cart' },
      { durationMs: 900, method: 'POST', route: '/api/checkout' },
      { durationMs: 1000, method: 'POST', route: '/api/checkout' },
      { durationMs: 10, route: '/api/orders' },
      { durationMs: 20, route: '/api/orders' },
    ]);
    await expect(slowRouteHandler.handle(rule(), analysis)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'POST /api/checkout P95 995.0ms exceeds threshold 100ms',
      },
      { ruleId: 'r-1', description: 'GET /api/cart P95 595.0ms exceeds threshold 100ms' },
    ]);
  });

  it('skips routes with fewer requests than minRequests', async () => {
    await writeLog([{ durationMs: 5000, route: '/api/cart' }]);
    await expect(slowRouteHandler.handle(rule({ thresholdMs: 100, minRequests: 2 }), analysis)).resolves.toEqual([]);
  });

  it('defaults minRequests to 10', async () => {
    await writeLog([{ durationMs: 5000 }, { durationMs: 5000 }]);
    await expect(slowRouteHandler.handle(rule({ thresholdMs: 100 }), analysis)).resolves.toEqual([]);
  });

  it('returns no issue when the rule has no threshold', async () => {
    await writeLog([{ durationMs: 5000 }, { durationMs: 5000 }]);
    await expect(slowRouteHandler.handle(rule({}), analysis)).resolves.toEqual([]);
  });
});
