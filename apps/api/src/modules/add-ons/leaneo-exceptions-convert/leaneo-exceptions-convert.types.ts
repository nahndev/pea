/** One line of a bug_log file (docs/bug_log.md) */
export interface BugEvent {
  ts?: number;
  level?: string;
  channel?: string;
  type: string;
  message?: string;
  location?: string;
  method?: string;
  route?: string;
  status?: number;
}
