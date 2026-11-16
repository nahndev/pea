import { describe, expect, it } from 'vitest';
import { buildUserSchema } from './users.schemas';

const input = { name: 'Ada', username: 'ada', password: 'correct horse', groupId: 'group-1' };
const messages = (value: unknown, isNew?: boolean) => {
  const result = buildUserSchema(isNew).safeParse(value);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('buildUserSchema', () => {
  it('normalizes the username like the api', () => {
    expect(buildUserSchema().parse({ ...input, username: ' Ada.L ' })).toMatchObject({ username: 'ada.l' });
  });

  it('rejects usernames with other characters', () => {
    expect(messages({ ...input, username: 'ada lovelace' })).toEqual(['username:invalid_username']);
  });

  it('requires a long enough password for a new user', () => {
    expect(messages({ ...input, password: '' })).toEqual(['password:password_too_short']);
    expect(messages({ ...input, password: 'short' })).toEqual(['password:password_too_short']);
  });

  it('keeps the current password when editing with an empty one', () => {
    expect(buildUserSchema(false).parse({ ...input, password: '' })).not.toHaveProperty('password', expect.anything());
    expect(messages({ ...input, password: 'short' }, false)).toEqual(['password:password_too_short']);
  });

  it('requires a group', () => {
    expect(messages({ ...input, groupId: '' })).toEqual(['groupId:required']);
  });
});
