export const AnalysisResultStatus = {
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type AnalysisResultStatus = (typeof AnalysisResultStatus)[keyof typeof AnalysisResultStatus];
