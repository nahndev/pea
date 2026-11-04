import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bugLogEvents } from './bug-log-events';
import { queryRows } from './duckdb-query';

describe('bugLogEvents', () => {
  let dir: string;
  const read = async (lines: string[]) => {
    const path = join(dir, 'bug_log.log');
    await writeFile(path, lines.join('\n'));
    return queryRows(`SELECT error_group, is_critical, endpoint, message, status FROM ${bugLogEvents(path)} ORDER BY error_group`);
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bug-log-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('reads one error event per line', async () => {
    await expect(
      read([
        '{"ts":1793181603523,"level":"CRITICAL","channel":"request","type":"DeadlockException","message":"Deadlock detected","location":"src/Repository/ProcessRepository.php:120","method":"POST","route":"/api/process/{id}","status":500}',
        '{"ts":1793181604000,"level":"ERROR","type":"NotFoundHttpException","message":"Not Found","route":"/favicon.ico","status":404}',
      ]),
    ).resolves.toEqual([
      {
        error_group: 'DeadlockException at src/Repository/ProcessRepository.php:120',
        is_critical: true,
        endpoint: 'POST /api/process/{id}',
        message: 'Deadlock detected',
        status: 500,
      },
      { error_group: 'NotFoundHttpException', is_critical: false, endpoint: '/favicon.ico', message: 'Not Found', status: 404 },
    ]);
  });

  it('only needs type; the other fields may be missing', async () => {
    await expect(read(['{"type":"API exception","location":""}'])).resolves.toEqual([
      { error_group: 'API exception', is_critical: false, endpoint: null, message: null, status: null },
    ]);
  });

  it('counts ALERT and EMERGENCY as critical, whatever the case', async () => {
    const rows = await read(['{"type":"a","level":"alert"}', '{"type":"b","level":"EMERGENCY"}', '{"type":"c","level":"WARNING"}']);
    expect(rows.map(({ is_critical }) => is_critical)).toEqual([true, true, false]);
  });

  it('ignores lines without type and unknown fields', async () => {
    await expect(read(['{"level":"ERROR"}', '{"type":"","level":"ERROR"}', '{"type":"x","trace":["a"]}'])).resolves.toEqual([
      { error_group: 'x', is_critical: false, endpoint: null, message: null, status: null },
    ]);
  });

  it('reads an empty file', async () => {
    await expect(read([])).resolves.toEqual([]);
  });
});
