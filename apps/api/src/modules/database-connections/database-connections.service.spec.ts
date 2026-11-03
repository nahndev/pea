import type { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { DatabaseConnectionsService } from './database-connections.service';

describe('DatabaseConnectionsService', () => {
  const configService = { get: () => 'a-test-key-that-is-long-enough-to-pass' } as unknown as ConfigService<Env, true>;
  const databaseConnectionsService = new DatabaseConnectionsService(configService);
  const connection = { host: 'db', port: 5432, database: 'shop', user: 'reader', password: 'secret' };

  it('decrypts what it encrypts without exposing the password', () => {
    const encrypted = databaseConnectionsService.encrypt(connection);

    expect(encrypted).not.toContain('secret');
    expect(databaseConnectionsService.decrypt(encrypted)).toEqual(connection);
  });

  it('uses a new iv for every encryption', () => {
    expect(databaseConnectionsService.encrypt(connection)).not.toBe(databaseConnectionsService.encrypt(connection));
  });

  it('rejects a tampered value', () => {
    const [iv, tag, data] = databaseConnectionsService.encrypt(connection).split('.');
    const tampered = Buffer.from(data, 'base64');
    tampered[0] ^= 1;

    expect(() => databaseConnectionsService.decrypt([iv, tag, tampered.toString('base64')].join('.'))).toThrow();
  });

  it.each([
    [connection, 'reader@db:5432/shop'],
    [{ connectionString: 'postgresql://reader:secret@db:6543/shop?sslmode=require' }, 'reader@db:6543/shop'],
  ])('describes %j without the password', (value, expected) => {
    expect(databaseConnectionsService.describe(value)).toBe(expected);
  });
});
