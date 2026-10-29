import { z } from 'zod';
import { MAX_FILE_SIZE } from './leaneo-slow-api-convert.constants';

export const convertSlowApiSchema = z.object({
  file: z
    .instanceof(File, { error: 'file_required' })
    .refine((file) => file.size > 0, 'empty')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'too_large'),
});

export type ConvertSlowApiInput = z.infer<typeof convertSlowApiSchema>;
