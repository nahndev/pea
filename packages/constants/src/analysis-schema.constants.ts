export const AnalysisSchema = {
  API: 'API',
  QUERY: 'QUERY',
  BUG: 'BUG',
} as const;

export type AnalysisSchema = (typeof AnalysisSchema)[keyof typeof AnalysisSchema];
