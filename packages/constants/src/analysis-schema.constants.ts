export const AnalysisSchema = {
  API: 'API',
  QUERY: 'QUERY',
  BUG: 'BUG',
  DATABASE: 'DATABASE',
} as const;

export type AnalysisSchema = (typeof AnalysisSchema)[keyof typeof AnalysisSchema];
