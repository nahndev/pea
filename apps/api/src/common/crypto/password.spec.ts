import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('verifies the hashed password', async () => {
    const stored = await hashPassword('correct horse');
    await expect(verifyPassword('correct horse', stored)).resolves.toBe(true);
    await expect(verifyPassword('wrong horse', stored)).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('any', '')).resolves.toBe(false);
    await expect(verifyPassword('any', 'abcd:zz')).resolves.toBe(false);
  });
});
