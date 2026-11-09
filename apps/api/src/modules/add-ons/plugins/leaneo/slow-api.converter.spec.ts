import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apiMetricRequests } from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { convertWith } from '../../add-ons.testing';
import { convertSlowApiLine } from './slow-api.converter';

const slowLine = (overrides: Record<string, unknown> = {}, request: Record<string, unknown> = {}) =>
  JSON.stringify({
    message: 'API response time',
    context: {
      request: { url: '/api/process/generate-pdf-wopi/87472/1/1/1018?timeZone=-60', method: 'GET', ...request },
      IPs: ['172.69.222.4'],
      user: 'someone@example.com',
      'requestTime: ': 1793137666.115035,
      responseTime: 1793137671.49362,
      elapsedMilleSecond: 5378,
      ...overrides,
    },
    level: 500,
    level_name: 'CRITICAL',
    datetime: '2026-10-27T21:47:51.493638+00:00',
  });

const convert = (lines: string[]) => convertWith(convertSlowApiLine, lines.join('\n'));

const lineOf = (content: string, index = 0) => JSON.parse(content.trim().split('\n')[index]);

describe('convertSlowApiLine', () => {
  it('converts a slow api line to an api_metric line', async () => {
    const { content, converted, skipped } = await convert([slowLine()]);

    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 0 });
    expect(lineOf(content)).toEqual({
      ts: 1793137671494,
      method: 'GET',
      route: '/api/process/generate-pdf-wopi/{id}/{id}/{id}/{id}',
      ms: 5378,
    });
  });

  it('keeps the duration in milliseconds as given', async () => {
    const { content } = await convert([slowLine({ elapsedMilleSecond: 12000 }), slowLine({ elapsedMilleSecond: 4 })]);
    expect([lineOf(content, 0).ms, lineOf(content, 1).ms]).toEqual([12000, 4]);
  });

  it('uses the response time as epoch milliseconds', async () => {
    const { content } = await convert([slowLine()]);
    expect(lineOf(content).ts).toBe(Math.round(1793137671.49362 * 1000));
  });

  it('falls back to datetime when the response time is missing', async () => {
    const { content } = await convert([slowLine({ responseTime: undefined })]);
    expect(lineOf(content).ts).toBe(Date.parse('2026-10-27T21:47:51.493638+00:00'));
  });

  it('keeps static routes and normalises uuid segments, query strings and method case', async () => {
    const { content } = await convert([
        slowLine({}, { url: '/api/activite_equipement/gets', method: 'post' }),
        slowLine({}, { url: '/api/orders/0b9f3d52-6d3f-4a8e-9a53-4f4b9c1b7a10?x=1' }),
        slowLine({}, { url: '/api/wopi/12/-1/3' }),
      ]);
    expect([0, 1, 2].map((index) => lineOf(content, index))).toMatchObject([
      { method: 'POST', route: '/api/activite_equipement/gets' },
      { method: 'GET', route: '/api/orders/{id}' },
      { method: 'GET', route: '/api/wopi/{id}/{id}/{id}' },
    ]);
  });

  it('writes only ts, method, route and ms', async () => {
    const { content } = await convert([slowLine()]);
    expect(Object.keys(lineOf(content)).sort()).toEqual(['method', 'ms', 'route', 'ts']);
  });

  it('does not leak the user or ip addresses', async () => {
    const { content } = await convert([slowLine()]);
    expect(content).not.toContain('someone@example.com');
    expect(content).not.toContain('172.69.222.4');
  });

  it('skips blank, malformed and incomplete lines and counts them', async () => {
    const { content, converted, skipped } = await convert([
        slowLine(),
        '',
        'not json',
        '42',
        JSON.stringify({ context: {} }),
        slowLine({ elapsedMilleSecond: 'slow' }),
        slowLine({ elapsedMilleSecond: -1 }),
        slowLine({ responseTime: undefined }).replace('2026-10-27T21:47:51.493638+00:00', 'nope'),
        slowLine({}, { method: 5 }),
      ]);
    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 7 });
    expect(content.trim().split('\n')).toHaveLength(1);
  });

  it('accepts windows line endings and ends the output with a newline', async () => {
    const { content, converted } = await convertWith(convertSlowApiLine, `${slowLine()}\r\n${slowLine()}\r\n`);
    expect(converted).toBe(2);
    expect(content.endsWith('\n')).toBe(true);
  });



  describe('analysis reader', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'slow-api-'));
    });
    afterEach(() => rm(dir, { recursive: true, force: true }));

    it('reads the converted file as api metric requests', async () => {
      const { content } = await convert([slowLine(), slowLine({ elapsedMilleSecond: 7257 }, { url: '/api/activite_equipement/gets' })]);
      const path = join(dir, 'api_metric.log');
      await writeFile(path, content);

      const requests = await queryRows(
        `SELECT endpoint, duration_ms, status_code FROM ${apiMetricRequests(path)} ORDER BY endpoint`,
      );

      expect(requests).toEqual([
        { endpoint: 'GET /api/activite_equipement/gets', duration_ms: 7257, status_code: null },
        { endpoint: 'GET /api/process/generate-pdf-wopi/{id}/{id}/{id}/{id}', duration_ms: 5378, status_code: null },
      ]);
    });
  });
});
