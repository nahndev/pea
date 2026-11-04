import { z } from 'zod';
import { logFileSchema } from '@/shared/lib/log-file.schemas';

export const convertSlowApiSchema = z.object({
  file: logFileSchema,
});

export type ConvertSlowApiInput = z.infer<typeof convertSlowApiSchema>;
