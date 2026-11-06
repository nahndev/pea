import { AddOn, AnalysisSchema } from '@tomato/constants';
import { z } from 'zod';
import { analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { logFileSchema } from '@/shared/lib/log-file.schemas';
import { API_METRIC_FILE_FIELD, BUG_LOG_FILE_FIELD } from './analyses.constants';

const requiredText = (max = 255) => z.string('required').trim().min(1, 'required').max(max, 'too_long');

const commonShape = {
  branch: requiredText(),
  title: requiredText(),
};

const addOnSchema = z.enum(Object.values(AddOn)).optional();

const apiMetricAnalysisSchema = z.object({
  ...commonShape,
  schema: z.enum(analysisSchemaValues).exclude([AnalysisSchema.DATABASE, AnalysisSchema.BUG]),
  [API_METRIC_FILE_FIELD.name]: logFileSchema,
  addOn: addOnSchema,
});

const bugAnalysisSchema = z.object({
  ...commonShape,
  schema: z.literal(AnalysisSchema.BUG),
  [BUG_LOG_FILE_FIELD.name]: logFileSchema,
  addOn: addOnSchema,
});

const databaseAnalysisSchema = z.object({
  ...commonShape,
  schema: z.literal(AnalysisSchema.DATABASE),
  databaseId: z.string('required').min(1, 'required'),
});

export const createAnalysisSchema = z.discriminatedUnion(
  'schema',
  [apiMetricAnalysisSchema, bugAnalysisSchema, databaseAnalysisSchema],
  'required',
);

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
