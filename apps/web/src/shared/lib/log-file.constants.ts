import { formatFileSize } from './format';

export const LOG_FILE_EXTENSIONS = ['.json', '.jsonl', '.ndjson', '.log', '.txt'] as const;
export const LOG_FILE_ACCEPT = LOG_FILE_EXTENSIONS.join(',');
export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;

export const LOG_FILE_ERRORS: Record<string, string> = {
  empty: 'The file is empty.',
  too_large: `The file must be at most ${formatFileSize(MAX_LOG_FILE_SIZE)}.`,
  invalid_type: `The file must be one of ${LOG_FILE_EXTENSIONS.join(', ')}.`,
};
