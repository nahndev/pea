import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { ConvertResult } from '../add-ons.types';
import { toRoute } from '../to-route';
import {
  APP_SOURCE_DIR,
  HTTP_STATUS_BY_EXCEPTION,
  MAX_MESSAGE_LENGTH,
  MAX_TYPE_LENGTH,
  MESSAGE_REPLACEMENTS,
  NO_ROUTE_MESSAGE,
  SERVER_ERROR_STATUS,
  UNCAUGHT_EXCEPTION_PREFIX,
} from './leaneo-exceptions-convert.constants';
import type { BugEvent } from './leaneo-exceptions-convert.types';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const asText = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);

const normalize = (text: string, max: number): string | undefined =>
  MESSAGE_REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text)
    .trim()
    .slice(0, max) || undefined;

const toPath = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

@Injectable()
export class LeaneoExceptionsConvertService {
  convert(file?: Express.Multer.File): ConvertResult {
    if (!file) throw new BadRequestException({ code: ErrorCode.LOG_FILE_REQUIRED });

    const lines: string[] = [];
    let skipped = 0;
    for (const raw of file.buffer.toString('utf8').split('\n')) {
      if (!raw.trim()) continue;
      const event = this.parse(raw);
      if (event) lines.push(JSON.stringify(event));
      else skipped += 1;
    }
    if (lines.length === 0) throw new BadRequestException({ code: ErrorCode.LOG_FILE_INVALID });

    return { content: `${lines.join('\n')}\n`, converted: lines.length, skipped };
  }

  private parse(raw: string): BugEvent | null {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return null;
    }

    const entry = asRecord(json);
    const context = asRecord(entry?.context);
    const exception = asRecord(context?.exception);
    const message = asText(entry?.message);
    const exceptionClass = asText(exception?.class)?.split('\\').pop();
    const type = exceptionClass ?? (message && normalize(message, MAX_TYPE_LENGTH));
    if (!type) return null;

    const ts = typeof entry?.datetime === 'string' ? Date.parse(entry.datetime) : NaN;
    const detail = asText(exception?.message) ?? message;
    return {
      ts: Number.isNaN(ts) ? undefined : ts,
      level: asText(entry?.level_name)?.toUpperCase(),
      channel: asText(entry?.channel),
      type,
      message: detail && normalize(detail, MAX_MESSAGE_LENGTH),
      location: this.toLocation(exception),
      ...this.toEndpoint(context, message),
      status: this.toStatus(exceptionClass, exception?.code, message),
    };
  }

  private toLocation(exception: Record<string, unknown> | undefined): string | undefined {
    const trace = Array.isArray(exception?.trace) ? exception.trace : [];
    const frame = [exception?.file, ...trace].find(
      (value): value is string => typeof value === 'string' && value.includes(APP_SOURCE_DIR),
    );
    return frame?.slice(frame.indexOf(APP_SOURCE_DIR) + 1);
  }

  private toEndpoint(context: Record<string, unknown> | undefined, message: string | undefined): Pick<BugEvent, 'method' | 'route'> {
    const api = asText(context?.api);
    if (api) return { route: toRoute(api) };
    const [, method, url] = message?.match(NO_ROUTE_MESSAGE) ?? [];
    return url ? { method, route: toRoute(toPath(url)) } : {};
  }

  private toStatus(exceptionClass: string | undefined, code: unknown, message: string | undefined): number | undefined {
    const status = exceptionClass && HTTP_STATUS_BY_EXCEPTION[exceptionClass];
    if (status) return status;
    if (message?.startsWith(UNCAUGHT_EXCEPTION_PREFIX)) return SERVER_ERROR_STATUS;
    return typeof code === 'number' && code >= 400 && code <= 599 ? code : undefined;
  }
}
