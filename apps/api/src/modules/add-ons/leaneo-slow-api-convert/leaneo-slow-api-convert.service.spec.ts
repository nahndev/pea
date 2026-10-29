import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apiMetricDurations } from '../../files/api-metric-durations';
import { apiMetricRequests } from '../../files/api-metric-requests';
import { queryRows } from '../../files/duckdb-query';
import { LeaneoSlowApiConvertService } from './leaneo-slow-api-convert.service';

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

const file = (lines: string[]) => ({ buffer: Buffer.from(lines.join('\n')) }) as Express.Multer.File;

const dataPointOf = (content: string, index = 0) => {
  const [line] = content.trim().split('\n').slice(index);
  const { resourceMetrics } = JSON.parse(line);
  return resourceMetrics[0].scopeMetrics[0].metrics[0].histogram.dataPoints[0];
};

describe('LeaneoSlowApiConvertService', () => {
  const service = new LeaneoSlowApiConvertService();

  it('converts a slow api line to an OTLP duration histogram', () => {
    const { content, converted, skipped } = service.convert(file([slowLine()]));
    const { resourceMetrics } = JSON.parse(content);
    const metric = resourceMetrics[0].scopeMetrics[0].metrics[0];
    const point = metric.histogram.dataPoints[0];

    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 0 });
    expect(metric.name).toBe('http.server.request.duration');
    expect(metric.unit).toBe('s');
    expect(point.sum).toBe(5.378);
    expect(point.count).toBe('1');
    expect(point.attributes).toEqual([
      { key: 'http.request.method', value: { stringValue: 'GET' } },
      { key: 'http.route', value: { stringValue: '/api/process/generate-pdf-wopi/{id}/{id}/{id}/{id}' } },
    ]);
  });

  it('puts the duration into the matching explicit bucket', () => {
    const { content } = service.convert(file([slowLine({ elapsedMilleSecond: 5378 }), slowLine({ elapsedMilleSecond: 12000 }), slowLine({ elapsedMilleSecond: 4 })]));
    const buckets = [0, 1, 2].map((index) => dataPointOf(content, index).bucketCounts.indexOf('1'));
    expect(buckets).toEqual([12, 14, 0]);
    expect(dataPointOf(content).bucketCounts).toHaveLength(dataPointOf(content).explicitBounds.length + 1);
  });

  it('converts timestamps to unix nanoseconds', () => {
    const { content } = service.convert(file([slowLine()]));
    const point = dataPointOf(content);
    expect(point.startTimeUnixNano).toBe('1793137666115035000');
    expect(point.timeUnixNano).toBe('1793137671493620000');
  });

  it('falls back to datetime and duration when request and response times are missing', () => {
    const { content } = service.convert(file([slowLine({ 'requestTime: ': undefined, responseTime: undefined, elapsedMilleSecond: 1000 })]));
    const point = dataPointOf(content);
    expect(point.timeUnixNano).toBe('1793137671493000000');
    expect(point.startTimeUnixNano).toBe('1793137670493000000');
  });

  it('keeps static routes and normalises uuid segments, query strings and method case', () => {
    const { content } = service.convert(
      file([
        slowLine({}, { url: '/api/activite_equipement/gets', method: 'post' }),
        slowLine({}, { url: '/api/orders/0b9f3d52-6d3f-4a8e-9a53-4f4b9c1b7a10?x=1' }),
        slowLine({}, { url: '/api/wopi/12/-1/3' }),
      ]),
    );
    const [first, second, third] = [0, 1, 2].map((index) => dataPointOf(content, index).attributes);
    expect(first).toEqual([
      { key: 'http.request.method', value: { stringValue: 'POST' } },
      { key: 'http.route', value: { stringValue: '/api/activite_equipement/gets' } },
    ]);
    expect(second[1].value.stringValue).toBe('/api/orders/{id}');
    expect(third[1].value.stringValue).toBe('/api/wopi/{id}/{id}/{id}');
  });

  it('does not leak the user or ip addresses', () => {
    const { content } = service.convert(file([slowLine()]));
    expect(content).not.toContain('someone@example.com');
    expect(content).not.toContain('172.69.222.4');
  });

  it('skips blank, malformed and incomplete lines and counts them', () => {
    const { content, converted, skipped } = service.convert(
      file([
        slowLine(),
        '',
        'not json',
        '42',
        JSON.stringify({ context: {} }),
        slowLine({ elapsedMilleSecond: 'slow' }),
        slowLine({ elapsedMilleSecond: -1 }),
        slowLine({ responseTime: undefined }).replace('2026-10-27T21:47:51.493638+00:00', 'nope'),
        slowLine({}, { method: 5 }),
      ]),
    );
    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 7 });
    expect(content.trim().split('\n')).toHaveLength(1);
  });

  it('accepts windows line endings and ends the output with a newline', () => {
    const { content, converted } = service.convert({ buffer: Buffer.from(`${slowLine()}\r\n${slowLine()}\r\n`) } as Express.Multer.File);
    expect(converted).toBe(2);
    expect(content.endsWith('\n')).toBe(true);
  });

  it('throws LOG_FILE_REQUIRED without a file', () => {
    expect.assertions(1);
    try {
      service.convert(undefined);
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.LOG_FILE_REQUIRED });
    }
  });

  it('throws LOG_FILE_INVALID when no line can be converted', () => {
    expect.assertions(1);
    try {
      service.convert(file(['not json', '']));
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.LOG_FILE_INVALID });
    }
  });

  describe('analysis readers', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'slow-api-'));
    });
    afterEach(() => rm(dir, { recursive: true, force: true }));

    it('reads the converted file as api metric durations and requests', async () => {
      const { content } = service.convert(
        file([slowLine(), slowLine({ elapsedMilleSecond: 7257 }, { url: '/api/activite_equipement/gets' })]),
      );
      const path = join(dir, 'api_metric.log');
      await writeFile(path, content);

      const durations = await queryRows(`SELECT duration_ms FROM ${apiMetricDurations(path)} ORDER BY duration_ms`);
      const requests = await queryRows(`SELECT endpoint, status_code FROM ${apiMetricRequests(path)} ORDER BY endpoint`);

      expect(durations.map((row) => Number(row.duration_ms))).toEqual([5378, 7257]);
      expect(requests).toEqual([
        { endpoint: 'GET /api/activite_equipement/gets', status_code: null },
        { endpoint: 'GET /api/process/generate-pdf-wopi/{id}/{id}/{id}/{id}', status_code: null },
      ]);
    });
  });
});
