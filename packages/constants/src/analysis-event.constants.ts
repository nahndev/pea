export const AnalysisEvent = {
  CREATED: 'analysis.created',
} as const;

export type AnalysisEvent = (typeof AnalysisEvent)[keyof typeof AnalysisEvent];
