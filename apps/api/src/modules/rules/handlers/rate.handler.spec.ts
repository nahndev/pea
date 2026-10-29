import { AnalysisContextType, RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { type ApiRequestFixture, otlpApiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { RateHandler } from './rate.handler';

describe('RateHandler', () => {
  let dir: string;
  let rateHandler: RateHandler;

  const rule = (type: string, config: object) => ({ id: 'r-1', type, config }) as Rule;
  const context = (type: string = AnalysisContextType.API_METRIC) =>
    ({ id: 'c-1', analysisId: 'an-1', file: 'api_metric.log', path: 'api_metric.log', type }) as AnalysisContext;

  const writeLog = (requests: ApiRequestFixture[]) =>
    writeFile(join(dir, 'api_metric.log'), requests.map(otlpApiRequestLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'rate-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    rateHandler = new RateHandler(storageService as unknown as StorageService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('flags a 5xx error rate above the threshold', async () => {
    await writeLog([{ durationMs: 10 }, { durationMs: 10 }, { durationMs: 10, statusCode: 500 }, { durationMs: 10 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 10 }), context())).resolves.toEqual([
      { ruleId: 'r-1', analysisContextId: 'c-1', description: '5xx error rate 25.0% exceeds threshold 10%' },
    ]);
  });

  it('does not count 4xx as a 5xx error', async () => {
    await writeLog([{ durationMs: 10, statusCode: 404 }, { durationMs: 10 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 10 }), context())).resolves.toEqual([]);
  });

  it('flags a 4xx error rate above the threshold', async () => {
    await writeLog([{ durationMs: 10, statusCode: 404 }, { durationMs: 10 }]);
    await expect(rateHandler.handle(rule(RuleType.CLIENT_ERROR_RATE, { maxPercent: 10 }), context())).resolves.toEqual([
      { ruleId: 'r-1', analysisContextId: 'c-1', description: '4xx error rate 50.0% exceeds threshold 10%' },
    ]);
  });

  it('flags a slow request rate above the threshold', async () => {
    await writeLog([{ durationMs: 2000 }, { durationMs: 10 }, { durationMs: 10 }, { durationMs: 10 }]);
    await expect(
      rateHandler.handle(rule(RuleType.SLOW_REQUEST_RATE, { thresholdMs: 1000, maxPercent: 5 }), context()),
    ).resolves.toEqual([
      { ruleId: 'r-1', analysisContextId: 'c-1', description: 'Slow request rate (>1000ms) 25.0% exceeds threshold 5%' },
    ]);
  });

  it('returns no issue when the rate is within the threshold', async () => {
    await writeLog([{ durationMs: 10 }, { durationMs: 10, statusCode: 500 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 50 }), context())).resolves.toEqual([]);
  });

  it('returns no issue for an empty log', async () => {
    await writeLog([]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 1 }), context())).resolves.toEqual([]);
  });

  it('returns no issue when the config is incomplete', async () => {
    await writeLog([{ durationMs: 2000, statusCode: 500 }]);
    await expect(rateHandler.handle(rule(RuleType.ERROR_RATE, {}), context())).resolves.toEqual([]);
    await expect(rateHandler.handle(rule(RuleType.SLOW_REQUEST_RATE, { maxPercent: 1 }), context())).resolves.toEqual([]);
  });

  it('ignores contexts that are not api metrics', async () => {
    await writeLog([{ durationMs: 10, statusCode: 500 }]);
    await expect(
      rateHandler.handle(rule(RuleType.ERROR_RATE, { maxPercent: 1 }), context(AnalysisContextType.QUERY)),
    ).resolves.toEqual([]);
  });
});
