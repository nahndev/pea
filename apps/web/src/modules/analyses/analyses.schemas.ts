import { z } from 'zod';
import { analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { LOG_FILE_FIELD, MAX_LOG_FILE_SIZE } from './analyses.constants';

const logFileSchema = z
  .instanceof(File, { error: 'file_required' })
  .refine((file) => file.size > 0, 'empty')
  .refine((file) => file.size <= MAX_LOG_FILE_SIZE, 'too_large');

export const createAnalysisSchema = z.object({
  branch: z.string().trim().min(1, 'required').max(255, 'too_long'),
  schema: z.enum(analysisSchemaValues, 'required'),
  mergeRequestIid: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.number('invalid').int('invalid').min(1, 'invalid').optional(),
  ),
  [LOG_FILE_FIELD.name]: logFileSchema,
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
