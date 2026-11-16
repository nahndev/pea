import { describe, expect, it } from 'vitest';
import { loginSchema } from './auth.schemas';

describe('loginSchema', () => {
  it('normalizes the username like the api', () => {
    expect(loginSchema.parse({ username: ' Ada ', password: 'secret' })).toEqual({ username: 'ada', password: 'secret' });
  });

  it('requires both fields', () => {
    const result = loginSchema.safeParse({ username: ' ', password: '' });
    expect(result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`)).toEqual(['username:required', 'password:required']);
  });
});
