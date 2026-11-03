import { AnalysisSchema } from '@tomato/constants';
import { z } from 'zod';
import { analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { DatabaseConnectionMode, LOG_FILE_FIELD, MAX_LOG_FILE_SIZE, POSTGRES_URL_PATTERN } from './analyses.constants';

const logFileSchema = z
  .instanceof(File, { error: 'file_required' })
  .refine((file) => file.size > 0, 'empty')
  .refine((file) => file.size <= MAX_LOG_FILE_SIZE, 'too_large');

const requiredText = (max = 255) => z.string('required').trim().min(1, 'required').max(max, 'too_long');

const commonShape = {
  branch: requiredText(),
  title: requiredText(),
};

const fileAnalysisSchema = z.object({
  ...commonShape,
  schema: z.enum(analysisSchemaValues).exclude([AnalysisSchema.DATABASE]),
  [LOG_FILE_FIELD.name]: logFileSchema,
});

const databaseFieldsSchema = z.object({
  ...commonShape,
  schema: z.literal(AnalysisSchema.DATABASE),
  connectionMode: z.literal(DatabaseConnectionMode.FIELDS),
  host: requiredText(),
  port: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.number('invalid_port').int('invalid_port').min(1, 'invalid_port').max(65535, 'invalid_port').optional(),
  ),
  database: requiredText(),
  user: requiredText(),
  password: z.string().max(255, 'too_long').optional(),
});

const databaseUrlSchema = z.object({
  ...commonShape,
  schema: z.literal(AnalysisSchema.DATABASE),
  connectionMode: z.literal(DatabaseConnectionMode.URL),
  connectionString: requiredText(2048).regex(POSTGRES_URL_PATTERN, 'invalid_connection_string'),
});

export const createAnalysisSchema = z.discriminatedUnion(
  'schema',
  [fileAnalysisSchema, z.discriminatedUnion('connectionMode', [databaseFieldsSchema, databaseUrlSchema])],
  'required',
);

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
