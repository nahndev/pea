export interface SlowApiRecord {
  url: string;
  method: string;
  durationMs: number;
  endSeconds: number;
}
