import { AnalysisContextType, RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { apiRequestLine } from '../../files/api-metric.fixtures';
import { StorageService } from '../../files/storage.service';
import { LatencyHandler } from './latency.handler';

describe('LatencyHandler', () => {
  let dir: string;
  let latencyHandler: LatencyHandler;

  const rule = (config: object = { thresholdMs: 100 }, type: string = RuleType.P90_FAILURE) =>
    ({ id: 'r-1', type, config }) as Rule;
  const context = (type: string = AnalysisContextType.API_METRIC) =>
    ({ id: 'c-1', analysisId: 'an-1', file: 'api_metric.log', path: 'api_metric.log', type }) as AnalysisContext;

  const writeLog = (durations: number[]) =>
    writeFile(
      join(dir, 'api_metric.log'),
      durations.map((duration) => apiRequestLine({ durationMs: duration })).join('\n'),
    );

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'latency-'));
    const storageService = { resolve: (path: string) => join(dir, path) };
    latencyHandler = new LatencyHandler(storageService as unknown as StorageService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns an issue linked to the rule when p90 exceeds the threshold', async () => {
    await writeLog([10, 20, 30, 40, 50, 60, 70, 80, 900, 1000]);
    await expect(latencyHandler.handle(rule(), context())).resolves.toEqual([
      {
        ruleId: 'r-1',
        analysisContextId: 'c-1',
        description: 'P90 910.0ms exceeds threshold 100ms',
      },
    ]);
  });

  it('returns no issue when p90 is within the threshold', async () => {
    await writeLog([10, 20, 30, 40, 50, 60, 70, 80, 90, 95]);
    await expect(latencyHandler.handle(rule(), context())).resolves.toEqual([]);
  });

  it('returns no issue for an empty log', async () => {
    await writeLog([]);
    await expect(latencyHandler.handle(rule(), context())).resolves.toEqual([]);
  });

  it('ignores contexts that are not api metrics', async () => {
    await writeLog([1000]);
    await expect(latencyHandler.handle(rule(), context(AnalysisContextType.QUERY))).resolves.toEqual([]);
  });

  it('returns no issue when the rule has no threshold', async () => {
    await writeLog([1000]);
    await expect(latencyHandler.handle(rule({}), context())).resolves.toEqual([]);
  });

  it.each([
    [RuleType.P50_FAILURE, 'P50 55.0ms'],
    [RuleType.P95_FAILURE, 'P95 955.0ms'],
    [RuleType.P99_FAILURE, 'P99 991.0ms'],
    [RuleType.AVG_LATENCY, 'Average 226.0ms'],
    [RuleType.MAX_LATENCY, 'Max 1000.0ms'],
  ])('measures %s', async (type, measured) => {
    await writeLog([10, 20, 30, 40, 50, 60, 70, 80, 900, 1000]);
    const [issue] = await latencyHandler.handle(rule({ thresholdMs: 1 }, type), context());
    expect(issue.description).toBe(`${measured} exceeds threshold 1ms`);
  });

  it('returns no issue for an unknown rule type', async () => {
    await writeLog([1000]);
    await expect(latencyHandler.handle(rule({ thresholdMs: 1 }, 'UNKNOWN'), context())).resolves.toEqual([]);
  });
});
