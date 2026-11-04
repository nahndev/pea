import { describe, expect, it } from 'vitest';
import { MAX_LOG_FILE_SIZE } from '@/shared/lib/log-file.constants';
import { convertExceptionsSchema } from './leaneo-exceptions-convert.schemas';

const messages = (input: unknown) => {
  const result = convertExceptionsSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('convertExceptionsSchema', () => {
  it('accepts a non-empty file', () => {
    expect(messages({ file: new File(['{}\n'], 'exceptions.log') })).toEqual([]);
  });

  it('requires a file', () => {
    expect(messages({})).toEqual(['file:file_required']);
  });

  it('rejects an empty file', () => {
    expect(messages({ file: new File([], 'exceptions.log') })).toEqual(['file:empty']);
  });

  it('rejects a file larger than the limit', () => {
    const file = new File(['x'], 'exceptions.log');
    Object.defineProperty(file, 'size', { value: MAX_LOG_FILE_SIZE + 1 });

    expect(messages({ file })).toEqual(['file:too_large']);
  });
});
