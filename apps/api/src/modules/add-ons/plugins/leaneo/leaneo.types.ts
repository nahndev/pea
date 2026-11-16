/** One line of a bug_log file (docs/bug_log.md) */
export interface BugEvent {
  '@timestamp'?: string;
  'log.level'?: string;
  message?: string;
  'http.request.method'?: string;
  'url.path'?: string;
  'http.response.status_code'?: number;
  'error.type'?: string;
  'error.message'?: string;
  'error.stack_trace'?: string;
}
export interface SlowApiRecord {
  url: string;
  method: string;
  durationMs: number;
  endSeconds: number;
}

/** One line of a frontend_metric file (docs/frontend_metric.md) */
export interface PageLoad {
  '@timestamp'?: string;
  name?: string;
  source?: string;
  route?: string;
  previousRoute?: string | null;
  status?: string;
  startTime?: number;
  duration: number;
  visibleDuration?: number;
  requestCount?: number;
  requestDuration?: number;
  longFrameCount?: number;
  longFrameDuration?: number;
  addedNodes?: number;
}
