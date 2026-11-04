import { z } from 'zod';
import { LOG_FILE_EXTENSIONS, MAX_LOG_FILE_SIZE } from './log-file.constants';

export const logFileSchema = z
  .instanceof(File, { error: 'file_required' })
  .refine((file) => file.size > 0, 'empty')
  .refine((file) => file.size <= MAX_LOG_FILE_SIZE, 'too_large')
  .refine((file) => LOG_FILE_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension)), 'invalid_type');
