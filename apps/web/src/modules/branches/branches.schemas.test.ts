import { describe, expect, it } from 'vitest';
import { createBranchSchema } from './branches.schemas';

const messages = (input: unknown) => {
  const result = createBranchSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ message }) => message);
};

describe('createBranchSchema', () => {
  it('trims the name', () => {
    expect(createBranchSchema.parse({ name: '  feat/x ' }).name).toBe('feat/x');
  });

  it('rejects a blank name', () => {
    expect(messages({ name: '   ' })).toEqual(['required']);
  });

  it('rejects a name over 255 characters', () => {
    expect(messages({ name: 'a'.repeat(256) })).toEqual(['too_long']);
  });
});
