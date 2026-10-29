import { AnalysisSchema } from '@tomato/constants';

export const ANALYSIS_SCHEMA_LABEL: Record<AnalysisSchema, string> = {
  [AnalysisSchema.API]: 'API',
  [AnalysisSchema.QUERY]: 'Query',
  [AnalysisSchema.BUG]: 'Bug',
};

export const DEFAULT_ANALYSIS_SCHEMA: AnalysisSchema = AnalysisSchema.API;

export const analysisSchemaValues = Object.values(AnalysisSchema) as [AnalysisSchema, ...AnalysisSchema[]];
