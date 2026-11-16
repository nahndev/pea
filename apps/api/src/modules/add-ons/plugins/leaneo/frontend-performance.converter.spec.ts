import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { queryRows } from '../../../files/duckdb-query';
import { frontendPageLoads } from '../../../files/frontend-page-loads';
import { convertWith } from '../../add-ons.testing';
import { convertFrontendPerformanceLine } from './frontend-performance.converter';

const performanceLine = (metric: Record<string, unknown> = {}, entry: Record<string, unknown> = {}) =>
  JSON.stringify({
    message: 'page-load',
    context: {
      metric: {
        name: 'page-load',
        source: 'route',
        route: '/tableau/:id',
        previousRoute: '/synthese/:id?',
        status: 'aborted',
        detail: { addedNodes: 1687, longFrameCount: 2, longFrameDuration: 448, requestCount: 9, requestDuration: 5358, slowRequests: [{ url: '/api/x?email=a@b.c' }] },
        startTime: 24458,
        visibleDuration: 273,
        duration: 2129,
        ...metric,
      },
      batch: {
        sessionId: '01a1e255-7978-7596-a970-72e26f13951d',
        sentAt: '2026-11-16T10:10:46Z',
        tid: '33c1bde5-2fab-4c17-9689-8556bf4058e7',
        aid: 'de6aa4a3-2abc-427d-a560-5202b1ca79d7',
      },
    },
    level: 200,
    level_name: 'INFO',
    channel: 'frontend_performance',
    datetime: '2026-11-16T03:10:46.564728+00:00',
    extra: {},
    ...entry,
  });

const convert = (lines: string[]) => convertWith(convertFrontendPerformanceLine, lines.join('\n'));

describe('convertFrontendPerformanceLine', () => {
  it('converts a page load to a flat frontend_metric line without ids nor urls', async () => {
    const { content, converted, skipped } = await convert([performanceLine()]);

    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 0 });
    expect(JSON.parse(content)).toEqual({
      '@timestamp': '2026-11-16T03:10:46.564Z',
      name: 'page-load',
      source: 'route',
      route: '/tableau/:id',
      previousRoute: '/synthese/:id?',
      status: 'aborted',
      startTime: 24458,
      duration: 2129,
      visibleDuration: 273,
      requestCount: 9,
      requestDuration: 5358,
      longFrameCount: 2,
      longFrameDuration: 448,
      addedNodes: 1687,
    });
    expect(content).not.toMatch(/sessionId|01a1e255|email|slowRequests/);
  });

  it('keeps a first load without previous route nor detail', async () => {
    const { content } = await convert([performanceLine({ previousRoute: null, detail: undefined, status: 'settled' })]);
    expect(JSON.parse(content)).toMatchObject({ previousRoute: null, status: 'settled', duration: 2129 });
    expect(JSON.parse(content)).not.toHaveProperty('requestCount');
  });

  it('skips lines without a metric duration and invalid json', async () => {
    const { converted, skipped } = await convert([
      performanceLine({ duration: undefined }),
      performanceLine({ duration: -1 }),
      JSON.stringify({ message: 'other', context: {} }),
      '{not json',
    ]);
    expect({ converted, skipped }).toEqual({ converted: 0, skipped: 4 });
  });

  it('writes a file read by frontendPageLoads', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'frontend-performance-'));
    try {
      const { content } = await convert([performanceLine(), performanceLine({ route: '/groupe', status: 'settled', duration: 1012 })]);
      const path = join(dir, 'frontend_metric.log');
      await writeFile(path, content);
      await expect(queryRows(`SELECT page, duration_ms, request_count, is_aborted FROM ${frontendPageLoads(path)} ORDER BY page`)).resolves.toEqual([
        { page: '[page-load][route] /groupe - from /synthese/:id?', duration_ms: 1012, request_count: 9, is_aborted: false },
        { page: '[page-load][route] /tableau/:id - from /synthese/:id?', duration_ms: null, request_count: 9, is_aborted: true },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
