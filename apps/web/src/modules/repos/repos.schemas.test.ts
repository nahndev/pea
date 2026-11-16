import { describe, expect, it } from 'vitest';
import { createRepoSchema } from './repos.schemas';

const messages = (input: unknown) => {
  const result = createRepoSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ message }) => message);
};

describe('createRepoSchema', () => {
  it('trims the name', () => {
    expect(createRepoSchema.parse({ name: '  feat/x ' }).name).toBe('feat/x');
  });

  it('rejects a blank name', () => {
    expect(messages({ name: '   ' })).toEqual(['required']);
  });

  it('rejects a name over 255 characters', () => {
    expect(messages({ name: 'a'.repeat(256) })).toEqual(['too_long']);
  });
});
