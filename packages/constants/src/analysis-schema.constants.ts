export const AnalysisSchema = {
  API: 'API',
  QUERY: 'QUERY',
  BUG: 'BUG',
  DATABASE: 'DATABASE',
  FRONTEND: 'FRONTEND',
} as const;

export type AnalysisSchema = (typeof AnalysisSchema)[keyof typeof AnalysisSchema];
