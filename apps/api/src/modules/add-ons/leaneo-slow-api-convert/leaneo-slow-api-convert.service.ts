import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { ID_PLACEHOLDER, ID_SEGMENT, MS_PER_SECOND } from './leaneo-slow-api-convert.constants';
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
      if (record) lines.push(this.toApiMetricLine(record));
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

    const datetimeSeconds = typeof entry?.datetime === 'string' ? Date.parse(entry.datetime) / MS_PER_SECOND : NaN;
    const endSeconds = asNumber(context?.responseTime) ?? (Number.isNaN(datetimeSeconds) ? undefined : datetimeSeconds);
    if (endSeconds === undefined) return null;

    return { url: request.url, method: request.method, durationMs, endSeconds };
  }

  private toApiMetricLine({ url, method, durationMs, endSeconds }: SlowApiRecord): string {
    return JSON.stringify({
      ts: Math.round(endSeconds * MS_PER_SECOND),
      method: method.toUpperCase(),
      route: this.toRoute(url),
      ms: durationMs,
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
}
