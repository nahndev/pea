import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apiMetricRequests } from './api-metric-requests';
import { queryRows } from './duckdb-query';

describe('apiMetricRequests', () => {
  let dir: string;
  const read = async (lines: string[]) => {
    const path = join(dir, 'api_metric.log');
    await writeFile(path, lines.join('\n'));
    return queryRows(`SELECT endpoint, duration_ms, status_code FROM ${apiMetricRequests(path)} ORDER BY duration_ms`);
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'api-metric-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('reads one request per line', async () => {
    await expect(
      read([
        '{"ts":1793181603523,"method":"GET","route":"/api/products","status":200,"ms":3522.9}',
        '{"ts":1793181604000,"method":"POST","route":"/api/checkout","status":503,"ms":120}',
      ]),
    ).resolves.toEqual([
      { endpoint: 'POST /api/checkout', duration_ms: 120, status_code: 503 },
      { endpoint: 'GET /api/products', duration_ms: 3522.9, status_code: 200 },
    ]);
  });

  it('only needs ms; the other fields may be missing', async () => {
    await expect(read(['{"ms":50}', '{"ms":60,"method":"GET"}'])).resolves.toEqual([
      { endpoint: '', duration_ms: 50, status_code: null },
      { endpoint: 'GET', duration_ms: 60, status_code: null },
    ]);
  });

  it('ignores lines without ms and unknown fields', async () => {
    await expect(
      read(['{"method":"GET","route":"/a"}', '{"ms":10,"ts":"not a number","trace":"abc","route":"/b"}']),
    ).resolves.toEqual([{ endpoint: '/b', duration_ms: 10, status_code: null }]);
  });

  it('reads an empty file', async () => {
    await expect(read([])).resolves.toEqual([]);
  });
});
