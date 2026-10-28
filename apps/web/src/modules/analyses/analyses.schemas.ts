import { z } from 'zod';
import { LOG_FILE_FIELDS, MAX_LOG_FILE_SIZE } from './analyses.constants';

const logFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, 'empty')
  .refine((file) => file.size <= MAX_LOG_FILE_SIZE, 'too_large')
  .optional();

export const createAnalysisSchema = z
  .object({
    branch: z.string().trim().min(1, 'required').max(255, 'too_long'),
    mergeRequestIid: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.number('invalid').int('invalid').min(1, 'invalid').optional(),
    ),
    api_metric: logFileSchema,
    query: logFileSchema,
  })
  .refine((input) => LOG_FILE_FIELDS.some(({ name }) => input[name]), { path: ['api_metric'], message: 'file_required' });

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

export const pageParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});
