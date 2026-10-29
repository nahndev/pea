import { RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Analysis, Rule } from '../../../generated/client';
import { type ApiRequestFixture, apiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { RateHandler } from './rate.handler';

describe('RateHandler', () => {
  let dir: string;
  let rateHandler: RateHandler;

  const rule = (type: string, config: object) => ({ id: 'r-1', type, config }) as Rule;
  const analysis = { id: 'an-1', file: 'api_metric.log', path: 'api_metric.log' } as Analysis;

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(apiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'rate-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    rateHandler = new RateHandler(storageService as unknown as StorageService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('flags a 5xx error rate above the threshold', async () => {
    await writeLog([{ durationMs: 10 }, { durationMs: 10 }, { durationMs: 10, statusCode: 500 }, { durationMs: 10 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 10 }), analysis)).resolves.toEqual([
      { ruleId: 'r-1', description: '5xx error rate 25.0% exceeds threshold 10%' },
    ]);
  });

  it('does not count 4xx as a 5xx error', async () => {
    await writeLog([{ durationMs: 10, statusCode: 404 }, { durationMs: 10 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 10 }), analysis)).resolves.toEqual([]);
  });

  it('flags a 4xx error rate above the threshold', async () => {
    await writeLog([{ durationMs: 10, statusCode: 404 }, { durationMs: 10 }]);
    await expect(rateHandler.handle(rule(RuleType.CLIENT_ERROR_RATE, { maxPercent: 10 }), analysis)).resolves.toEqual([
      { ruleId: 'r-1', description: '4xx error rate 50.0% exceeds threshold 10%' },
    ]);
  });

  it('flags a slow request rate above the threshold', async () => {
    await writeLog([{ durationMs: 2000 }, { durationMs: 10 }, { durationMs: 10 }, { durationMs: 10 }]);
    await expect(
      rateHandler.handle(rule(RuleType.SLOW_REQUEST_RATE, { thresholdMs: 1000, maxPercent: 5 }), analysis),
    ).resolves.toEqual([
      { ruleId: 'r-1', description: 'Slow request rate (>1000ms) 25.0% exceeds threshold 5%' },
    ]);
  });

  it('returns no issue when the rate is within the threshold', async () => {
    await writeLog([{ durationMs: 10 }, { durationMs: 10, statusCode: 500 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 50 }), analysis)).resolves.toEqual([]);
  });

  it('returns no issue for an empty log', async () => {
    await writeLog([]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 1 }), analysis)).resolves.toEqual([]);
  });

  it('returns no issue when the config is incomplete', async () => {
    await writeLog([{ durationMs: 2000, statusCode: 500 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, {}), analysis)).resolves.toEqual([]);
    await expect(rateHandler.handle(rule(RuleType.SLOW_REQUEST_RATE, { maxPercent: 1 }), analysis)).resolves.toEqual([]);
  });
});
