import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { DURATION_METRIC_NAME, SECONDS_TO_MS } from '../../files/api-metric-durations';
import {
  DURATION_UNIT,
  EXPLICIT_BOUNDS,
  ID_PLACEHOLDER,
  ID_SEGMENT,
  MICROS_PER_SECOND,
  NANOS_PER_MICRO,
  REQUEST_TIME_KEYS,
  SCOPE_NAME,
  SERVICE_NAME,
} from './leaneo-slow-api-convert.constants';
import type { ConvertResult, SlowApiRecord } from './leaneo-slow-api-convert.types';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

@Injectable()
export class LeaneoSlowApiConvertService {
  convert(file?: Express.Multer.File): ConvertResult {
    if (!file) throw new BadRequestException({ code: ErrorCode.LOG_FILE_REQUIRED });

    const lines: string[] = [];
    let skipped = 0;
    for (const raw of file.buffer.toString('utf8').split('\n')) {
      if (!raw.trim()) continue;
      const record = this.parse(raw);
      if (record) lines.push(this.toOtlpLine(record));
      else skipped += 1;
    }
    if (lines.length === 0) throw new BadRequestException({ code: ErrorCode.LOG_FILE_INVALID });

    return { content: `${lines.join('\n')}\n`, converted: lines.length, skipped };
  }

  private parse(raw: string): SlowApiRecord | null {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return null;
    }

    const entry = asRecord(json);
    const context = asRecord(entry?.context);
    const request = asRecord(context?.request);
    const durationMs = asNumber(context?.elapsedMilleSecond);
    if (typeof request?.url !== 'string' || typeof request.method !== 'string') return null;
    if (durationMs === undefined || durationMs < 0) return null;

    const datetimeSeconds = typeof entry?.datetime === 'string' ? Date.parse(entry.datetime) / 1000 : NaN;
    const endSeconds = asNumber(context?.responseTime) ?? (Number.isNaN(datetimeSeconds) ? undefined : datetimeSeconds);
    if (endSeconds === undefined) return null;

    const startSeconds =
      REQUEST_TIME_KEYS.map((key) => asNumber(context?.[key])).find((value) => value !== undefined) ??
      endSeconds - durationMs / SECONDS_TO_MS;

    return { url: request.url, method: request.method, durationMs, startSeconds, endSeconds };
  }

  private toOtlpLine({ url, method, durationMs, startSeconds, endSeconds }: SlowApiRecord): string {
    const seconds = durationMs / SECONDS_TO_MS;
    const bucketCounts = EXPLICIT_BOUNDS.map(() => '0').concat('0');
    const bucket = EXPLICIT_BOUNDS.findIndex((bound) => seconds <= bound);
    bucketCounts[bucket === -1 ? EXPLICIT_BOUNDS.length : bucket] = '1';

    return JSON.stringify({
      resourceMetrics: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: SERVICE_NAME } }] },
          scopeMetrics: [
            {
              scope: { name: SCOPE_NAME },
              metrics: [
                {
                  name: DURATION_METRIC_NAME,
                  unit: DURATION_UNIT,
                  histogram: {
                    aggregationTemporality: 1,
                    dataPoints: [
                      {
                        attributes: [
                          { key: 'http.request.method', value: { stringValue: method.toUpperCase() } },
                          { key: 'http.route', value: { stringValue: this.toRoute(url) } },
                        ],
                        startTimeUnixNano: this.toNanos(startSeconds),
                        timeUnixNano: this.toNanos(endSeconds),
                        count: '1',
                        sum: seconds,
                        min: seconds,
                        max: seconds,
                        bucketCounts,
                        explicitBounds: EXPLICIT_BOUNDS,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  }

  private toRoute(url: string): string {
    const [path] = url.split('?');
    const route = path
      .split('/')
      .map((segment) => (ID_SEGMENT.test(segment) ? ID_PLACEHOLDER : segment))
      .join('/');
    return route || '/';
  }

  private toNanos(seconds: number): string {
    return (BigInt(Math.round(seconds * MICROS_PER_SECOND)) * NANOS_PER_MICRO).toString();
  }
}
