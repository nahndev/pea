import { AnalysisContextType, RuleType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { UploadService } from '../../files/upload.service';
import { P90Handler } from './p90.handler';

describe('P90Handler', () => {
  let dir: string;
  let handler: P90Handler;

  const rule = (config: object = { thresholdMs: 100 }) =>
    ({ id: 'r-1', type: RuleType.P90_FAILURE, config }) as Rule;
  const context = (type: string = AnalysisContextType.API_METRIC) =>
    ({ id: 'c-1', analysisId: 'an-1', file: 'api_metric.log', path: 'api_metric.log', type }) as AnalysisContext;

  const writeLog = (durations: number[]) =>
    writeFile(
      join(dir, 'api_metric.log'),
      durations.map((duration_ms) => JSON.stringify({ duration_ms })).join('\n'),
    );

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'p90-'));
    const uploadService = { resolve: (path: string) => join(dir, path) };
    handler = new P90Handler(uploadService as unknown as UploadService);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns an issue linked to the rule when p90 exceeds the threshold', async () => {
    await writeLog([10, 20, 30, 40, 50, 60, 70, 80, 900, 1000]);
    await expect(handler.handle(rule(), context())).resolves.toEqual([
      { ruleId: 'r-1', analysisContextId: 'c-1' },
    ]);
  });

  it('returns no issue when p90 is within the threshold', async () => {
    await writeLog([10, 20, 30, 40, 50, 60, 70, 80, 90, 95]);
    await expect(handler.handle(rule(), context())).resolves.toEqual([]);
  });

  it('returns no issue for an empty log', async () => {
    await writeLog([]);
    await expect(handler.handle(rule(), context())).resolves.toEqual([]);
  });

  it('ignores contexts that are not api metrics', async () => {
    await writeLog([1000]);
    await expect(handler.handle(rule(), context(AnalysisContextType.SQL))).resolves.toEqual([]);
  });

  it('returns no issue when the rule has no threshold', async () => {
    await writeLog([1000]);
    await expect(handler.handle(rule({}), context())).resolves.toEqual([]);
  });
});
