export const AnalysisContextType = {
  QUERY: 'QUERY',
  API_METRIC: 'API_METRIC',
} as const;

export type AnalysisContextType = (typeof AnalysisContextType)[keyof typeof AnalysisContextType];
