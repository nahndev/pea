import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { DatabaseCheckStatus, DatabaseCheckType, ErrorCode } from '@tomato/constants';
import type { DatabaseCheck } from '@tomato/types';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Client } from 'pg';
import {
  CONNECTION_CIPHER,
  CONNECTION_IV_LENGTH,
  CONNECTION_TIMEOUT_MS,
  SERVER_CHECK_TYPES,
  STATEMENT_TIMEOUT_MS,
} from './database-connections.constants';
import type { DatabaseConnection } from './database-connections.types';
import { toConnectionErrorCode } from './postgres-errors';
import { inspectServer, skippedCheck } from './postgres-inspection';

@Injectable()
export class DatabaseConnectionsService {
  private readonly key: Buffer;

  constructor(configService: ConfigService<Env, true>) {
    this.key = createHash('sha256').update(configService.get('DATABASE_CONNECTION_KEY', { infer: true })).digest();
  }

  encrypt(connection: DatabaseConnection): string {
    const iv = randomBytes(CONNECTION_IV_LENGTH);
    const cipher = createCipheriv(CONNECTION_CIPHER, this.key, iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(connection), 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
  }

  decrypt(encrypted: string): DatabaseConnection {
    const [iv, tag, data] = encrypted.split('.').map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv(CONNECTION_CIPHER, this.key, iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')) as DatabaseConnection;
  }

  describe(connection: DatabaseConnection): string {
    if ('connectionString' in connection) {
      const url = new URL(connection.connectionString);
      return `${decodeURIComponent(url.username)}@${url.host}${url.pathname}`;
    }
    const { user, host, port, database } = connection;
    return `${user}@${host}:${port}/${database}`;
  }

  async verify(connection: DatabaseConnection): Promise<void> {
    await this.withClient(connection, (client) => client.query('SELECT 1'));
  }

  async inspect(connection: DatabaseConnection): Promise<DatabaseCheck[]> {
    try {
      return await this.withClient(connection, async (client) => [
        { type: DatabaseCheckType.CONNECTION, status: DatabaseCheckStatus.PASSED },
        ...(await inspectServer(client)),
      ]);
    } catch (error) {
      if (!(error instanceof UnprocessableEntityException)) throw error;
      const { code } = error.getResponse() as { code: ErrorCode };
      return [{ type: DatabaseCheckType.CONNECTION, status: DatabaseCheckStatus.FAILED, code }, ...SERVER_CHECK_TYPES.map(skippedCheck)];
    }
  }

  /** Runs `use` on a read-only client; connection failures become an `UnprocessableEntityException` with their cause. */
  async withClient<T>(connection: DatabaseConnection, use: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({
      ...connection,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      statement_timeout: STATEMENT_TIMEOUT_MS,
      options: '-c default_transaction_read_only=on',
    });
    try {
      await client.connect();
    } catch (error) {
      await client.end().catch(() => undefined);
      throw new UnprocessableEntityException({ code: toConnectionErrorCode(error) });
    }
    try {
      return await use(client);
    } finally {
      await client.end();
    }
  }
}
