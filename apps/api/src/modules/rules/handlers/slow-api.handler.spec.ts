import { AnalysisContextType, RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { type ApiRequestFixture, otlpApiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { SlowApiHandler } from './slow-api.handler';

describe('SlowApiHandler', () => {
  let dir: string;
  let slowApiHandler: SlowApiHandler;

  const rule = (config: object = { thresholdMs: 2000 }) => ({ id: 'r-1', type: RuleType.SLOW_API, config }) as Rule;
  const context = (type: string = AnalysisContextType.API_METRIC) =>
    ({ id: 'c-1', analysisId: 'an-1', file: 'api_metric.log', path: 'api_metric.log', type }) as AnalysisContext;

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(otlpApiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'slow-api-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    slowApiHandler = new SlowApiHandler(storageService as unknown as StorageService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one issue per API with a request over the threshold, slowest first', async () => {
    await writeLog([
      { durationMs: 2500, route: '/api/cart' },
      { durationMs: 100, route: '/api/cart' },
      { durationMs: 4000, method: 'POST', route: '/api/checkout' },
      { durationMs: 3000, method: 'POST', route: '/api/checkout' },
      { durationMs: 1999, route: '/api/orders' },
    ]);
    await expect(slowApiHandler.handle(rule(), context())).resolves.toEqual([
      {
        ruleId: 'r-1',
        analysisContextId: 'c-1',
        description: 'POST /api/checkout expected less than 2000ms, current max is 4000.0ms',
      },
      {
        ruleId: 'r-1',
        analysisContextId: 'c-1',
        description: 'GET /api/cart expected less than 2000ms, current max is 2500.0ms',
      },
    ]);
  });

  it('returns no issue when every API is within the threshold', async () => {
    await writeLog([{ durationMs: 2000 }, { durationMs: 10 }]);
    await expect(slowApiHandler.handle(rule(), context())).resolves.toEqual([]);
  });

  it('returns no issue when the rule has no threshold', async () => {
    await writeLog([{ durationMs: 5000 }]);
    await expect(slowApiHandler.handle(rule({}), context())).resolves.toEqual([]);
  });

  it('ignores contexts that are not api metrics', async () => {
    await writeLog([{ durationMs: 5000 }]);
    await expect(slowApiHandler.handle(rule(), context(AnalysisContextType.QUERY))).resolves.toEqual([]);
  });
});
