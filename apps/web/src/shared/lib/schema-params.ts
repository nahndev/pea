import { z } from 'zod';
import { DEFAULT_ANALYSIS_SCHEMA, analysisSchemaValues } from './analysis-schema.constants';

export const schemaParamsSchema = z.object({
  schema: z.enum(analysisSchemaValues).catch(DEFAULT_ANALYSIS_SCHEMA),
});
