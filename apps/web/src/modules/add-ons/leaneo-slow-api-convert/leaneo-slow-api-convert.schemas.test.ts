import { describe, expect, it } from 'vitest';
import { MAX_FILE_SIZE } from './leaneo-slow-api-convert.constants';
import { convertSlowApiSchema } from './leaneo-slow-api-convert.schemas';

const messages = (input: unknown) => {
  const result = convertSlowApiSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('convertSlowApiSchema', () => {
  it('accepts a non-empty file', () => {
    expect(messages({ file: new File(['{}\n'], 'slow_api.log') })).toEqual([]);
  });

  it('requires a file', () => {
    expect(messages({})).toEqual(['file:file_required']);
  });

  it('rejects an empty file', () => {
    expect(messages({ file: new File([], 'slow_api.log') })).toEqual(['file:empty']);
  });

  it('rejects a file larger than the limit', () => {
    const file = new File(['x'], 'slow_api.log');
    Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });

    expect(messages({ file })).toEqual(['file:too_large']);
  });
});
