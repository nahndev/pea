import type { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { DatabaseCheckStatus, DatabaseCheckType, ErrorCode } from '@tomato/constants';
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

  it('fails the connection check with its cause and skips the server checks', async () => {
    const checks = await databaseConnectionsService.inspect({ connectionString: 'postgresql://reader:secret@127.0.0.1:1/shop' });

    expect(checks[0]).toEqual({ type: DatabaseCheckType.CONNECTION, status: DatabaseCheckStatus.FAILED, code: ErrorCode.DATABASE_HOST_UNREACHABLE });
    expect(checks.slice(1).every(({ status }) => status === DatabaseCheckStatus.SKIPPED)).toBe(true);
  });
});
