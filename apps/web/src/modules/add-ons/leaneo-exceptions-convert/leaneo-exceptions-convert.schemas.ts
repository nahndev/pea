import { z } from 'zod';
import { logFileSchema } from '@/shared/lib/log-file.schemas';

export const convertExceptionsSchema = z.object({
  file: logFileSchema,
});

export type ConvertExceptionsInput = z.infer<typeof convertExceptionsSchema>;
