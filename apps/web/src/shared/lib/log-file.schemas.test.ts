import { describe, expect, it } from 'vitest';
import { MAX_LOG_FILE_SIZE } from './log-file.constants';
import { logFileSchema } from './log-file.schemas';

const messages = (input: unknown) => {
  const result = logFileSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ message }) => message);
};

describe('logFileSchema', () => {
  it('accepts a non-empty log file', () => {
    expect(messages(new File(['{}\n'], 'events.NDJSON'))).toEqual([]);
  });

  it('requires a file', () => {
    expect(messages(undefined)).toEqual(['file_required']);
  });

  it('rejects an empty file', () => {
    expect(messages(new File([], 'events.log'))).toEqual(['empty']);
  });

  it('rejects a file larger than the limit', () => {
    const file = new File(['x'], 'events.log');
    Object.defineProperty(file, 'size', { value: MAX_LOG_FILE_SIZE + 1 });

    expect(messages(file)).toEqual(['too_large']);
  });

  it('rejects an unsupported extension', () => {
    expect(messages(new File(['x'], 'events.csv'))).toEqual(['invalid_type']);
  });
});
