export const AnalysisContextType = {
  SQL: 'SQL',
  API_METRIC: 'API_METRIC',
} as const;

export type AnalysisContextType = (typeof AnalysisContextType)[keyof typeof AnalysisContextType];
