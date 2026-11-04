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
