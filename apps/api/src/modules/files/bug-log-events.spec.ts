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
    return queryRows(`SELECT error_group, is_critical, endpoint, message, status, ts FROM ${bugLogEvents(path)} ORDER BY error_group`);
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bug-log-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('reads one error event per line', async () => {
    await expect(
      read([
        JSON.stringify({
          '@timestamp': '2026-11-04T10:15:32.481Z',
          'log.level': 'critical',
          message: 'Payment failed',
          'service.name': 'payment-api',
          'trace.id': '4bf92f3577b34da6',
          'http.request.method': 'POST',
          'url.path': '/api/payments/{id}',
          'http.response.status_code': 500,
          'error.type': 'TimeoutError',
          'error.message': 'timeout after 30000ms',
          'error.stack_trace': 'vendor/guzzle/Client.php:12\n  src/Payment/Gateway.php:40\nsrc/Controller/PaymentController.php:18',
        }),
        '{"log.level":"error","message":"Not Found","error.type":"NotFoundHttpException","url.path":"/favicon.ico","http.response.status_code":404}',
      ]),
    ).resolves.toEqual([
      { error_group: 'NotFoundHttpException', is_critical: false, endpoint: '/favicon.ico', message: 'Not Found', status: 404, ts: null },
      {
        error_group: 'payment-api: TimeoutError at src/Payment/Gateway.php:40',
        is_critical: true,
        endpoint: 'POST /api/payments/{id}',
        message: 'timeout after 30000ms',
        status: 500,
        ts: BigInt(Date.parse('2026-11-04T10:15:32.481Z')),
      },
    ]);
  });

  it('types an event without error by its message', async () => {
    await expect(read(['{"message":"API exception","error.stack_trace":""}'])).resolves.toEqual([
      { error_group: 'API exception', is_critical: false, endpoint: null, message: 'API exception', status: null, ts: null },
    ]);
  });

  it('counts critical, alert, emergency and fatal as critical, whatever the case', async () => {
    const rows = await read(
      ['CRITICAL', 'alert', 'Emergency', 'fatal', 'error'].map((level, index) => JSON.stringify({ 'error.type': `${index}`, 'log.level': level })),
    );
    expect(rows.map(({ is_critical }) => is_critical)).toEqual([true, true, true, true, false]);
  });

  it('ignores lines without error type nor message, an invalid timestamp and unknown fields', async () => {
    await expect(
      read(['{"log.level":"error"}', '{"error.type":" ","message":""}', '{"error.type":"x","@timestamp":"yesterday","labels":["a"]}']),
    ).resolves.toEqual([{ error_group: 'x', is_critical: false, endpoint: null, message: null, status: null, ts: null }]);
  });

  it('reads an empty file', async () => {
    await expect(read([])).resolves.toEqual([]);
  });
});
