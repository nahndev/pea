import { AnalysisSchema } from '@tomato/constants';

export const LogFileField = {
  API_METRIC: 'api_metric',
  BUG_LOG: 'bug_log',
  FRONTEND_METRIC: 'frontend_metric',
} as const;

export type LogFileField = (typeof LogFileField)[keyof typeof LogFileField];

export const LOG_FILE_FIELD_BY_SCHEMA: Readonly<Record<Exclude<AnalysisSchema, typeof AnalysisSchema.DATABASE>, LogFileField>> = {
  [AnalysisSchema.API]: LogFileField.API_METRIC,
  [AnalysisSchema.QUERY]: LogFileField.API_METRIC,
  [AnalysisSchema.BUG]: LogFileField.BUG_LOG,
  [AnalysisSchema.FRONTEND]: LogFileField.FRONTEND_METRIC,
};
export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_BULK_ANALYSES = 20;
export const MAX_TREND_PICKS = 10;
