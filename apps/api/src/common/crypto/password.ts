import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** `salt:hash`, both hex */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scryptAsync(password, salt, KEY_BYTES);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash ?? '', 'hex');
  if (!salt || expected.length !== KEY_BYTES) return false;
  return timingSafeEqual(await scryptAsync(password, Buffer.from(salt, 'hex'), KEY_BYTES), expected);
}
