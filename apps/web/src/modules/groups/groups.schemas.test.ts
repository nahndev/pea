import { Permission } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { groupSchema } from './groups.schemas';

const messages = (input: unknown) => {
  const result = groupSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('groupSchema', () => {
  it('trims the name and keeps the permissions', () => {
    expect(groupSchema.parse({ name: ' Analysts ', permissions: [Permission.REPO_VIEW] })).toEqual({ name: 'Analysts', permissions: [Permission.REPO_VIEW] });
  });

  it('accepts a group without permissions', () => {
    expect(messages({ name: 'Guests', permissions: [] })).toEqual([]);
  });

  it('requires a name and rejects unknown permissions', () => {
    expect(messages({ name: ' ', permissions: ['root'] })).toEqual(['name:required', 'permissions.0:invalid']);
  });
});
