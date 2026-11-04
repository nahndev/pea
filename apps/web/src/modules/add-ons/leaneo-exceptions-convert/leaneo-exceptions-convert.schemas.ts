import { z } from 'zod';
import { MAX_FILE_SIZE } from './leaneo-exceptions-convert.constants';

export const convertExceptionsSchema = z.object({
  file: z
    .instanceof(File, { error: 'file_required' })
    .refine((file) => file.size > 0, 'empty')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'too_large'),
});

export type ConvertExceptionsInput = z.infer<typeof convertExceptionsSchema>;
