export interface SlowApiRecord {
  url: string;
  method: string;
  durationMs: number;
  endSeconds: number;
}

export interface ConvertResult {
  content: string;
  converted: number;
  skipped: number;
}
