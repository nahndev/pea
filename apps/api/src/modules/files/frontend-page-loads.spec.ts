import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { queryRows } from './duckdb-query';
import { frontendPageLoads } from './frontend-page-loads';

describe('frontendPageLoads', () => {
  let dir: string;
  const read = async (lines: string[]) => {
    const path = join(dir, 'frontend_metric.log');
    await writeFile(path, lines.join('\n'));
    return queryRows(
      `SELECT page, duration_ms, visible_ms, long_frame_ms, request_count, is_aborted FROM ${frontendPageLoads(path)} ORDER BY page`,
    );
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'frontend-metric-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('reads one page load per line', async () => {
    await expect(
      read([
        '{"@timestamp":"2026-11-16T03:09:36.343Z","name":"page-load","source":"route","route":"/synthese/:id?","previousRoute":null,"status":"settled","duration":12183,"visibleDuration":3729,"requestCount":58,"requestDuration":29880,"longFrameCount":9,"longFrameDuration":3554,"addedNodes":1825}',
        '{"name":"page-load","source":"route","route":"/groupe","previousRoute":"/synthese/:id?","status":"settled","duration":1012,"visibleDuration":66,"requestCount":2,"longFrameDuration":116}',
      ]),
    ).resolves.toEqual([
      { page: '[page-load][route] /groupe', duration_ms: 1012, visible_ms: 66, long_frame_ms: 116, request_count: 2, is_aborted: false },
      { page: '[page-load][route] /synthese/:id?', duration_ms: 12183, visible_ms: 3729, long_frame_ms: 3554, request_count: 58, is_aborted: false },
    ]);
  });

  it('keeps aborted loads without their durations', async () => {
    await expect(
      read(['{"route":"/tableau/:id","status":"Aborted","duration":2129,"visibleDuration":273,"requestCount":9,"longFrameDuration":448}']),
    ).resolves.toEqual([
      { page: '[page-load] /tableau/:id', duration_ms: null, visible_ms: null, long_frame_ms: 448, request_count: 9, is_aborted: true },
    ]);
  });

  it('ignores lines without duration and other metrics', async () => {
    await expect(
      read(['{"route":"/a"}', '{"name":"interaction","route":"/b","duration":5}', '{"duration":10,"route":" ","sessionId":"x"}']),
    ).resolves.toEqual([{ page: null, duration_ms: 10, visible_ms: null, long_frame_ms: null, request_count: null, is_aborted: false }]);
  });

  it('reads an empty file', async () => {
    await expect(read([])).resolves.toEqual([]);
  });
});
