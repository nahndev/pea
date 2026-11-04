import { AnalysisSchema } from '@tomato/constants';
import { z } from 'zod';
import { analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { API_METRIC_FILE_FIELD, BUG_LOG_FILE_FIELD, MAX_LOG_FILE_SIZE } from './analyses.constants';

const logFileSchema = z
  .instanceof(File, { error: 'file_required' })
  .refine((file) => file.size > 0, 'empty')
  .refine((file) => file.size <= MAX_LOG_FILE_SIZE, 'too_large');

const requiredText = (max = 255) => z.string('required').trim().min(1, 'required').max(max, 'too_long');

const commonShape = {
  branch: requiredText(),
  title: requiredText(),
};

const apiMetricAnalysisSchema = z.object({
  ...commonShape,
  schema: z.enum(analysisSchemaValues).exclude([AnalysisSchema.DATABASE, AnalysisSchema.BUG]),
  [API_METRIC_FILE_FIELD.name]: logFileSchema,
});

const bugAnalysisSchema = z.object({
  ...commonShape,
  schema: z.literal(AnalysisSchema.BUG),
  [BUG_LOG_FILE_FIELD.name]: logFileSchema,
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
