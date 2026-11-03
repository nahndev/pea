import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { DatabaseCheckStatus, DatabaseCheckType, ErrorCode } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import type { DatabaseConnection } from '../database-connections/database-connections.types';
import { createQuerySubject } from '../database-connections/postgres-stats';
import { DatabasesRepository } from './databases.repository';
import { DatabasesService } from './databases.service';
import type { DatabaseWithCount } from './databases.types';

describe('DatabasesService', () => {
  const configService = { get: () => 'a-test-key-that-is-long-enough-to-pass' } as unknown as ConfigService<Env, true>;
  const fields = { host: 'db', port: 5432, database: 'shop', user: 'reader', password: 'secret' };
  const createdAt = new Date('2026-11-01T00:00:00.000Z');
  let databaseConnectionsService: DatabaseConnectionsService;
  let databasesRepository: jest.Mocked<Pick<DatabasesRepository, 'findAll' | 'findById' | 'findByName' | 'create' | 'update' | 'delete' | 'findQueryStats' | 'saveQueryStats'>>;
  let databasesService: DatabasesService;

  const record = (connection: DatabaseConnection, analyses = 0): DatabaseWithCount => ({
    id: 'db-1',
    name: 'Shop',
    connection: databaseConnectionsService.encrypt(connection),
    createdAt,
    updatedAt: createdAt,
    _count: { analyses },
  });
  const savedConnection = () => {
    const data = databasesRepository.create.mock.calls[0]?.[0] ?? databasesRepository.update.mock.calls[0][1];
    return databaseConnectionsService.decrypt(data.connection!);
  };
  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: ConflictException) => e);
    return (error as ConflictException).getResponse();
  };

  beforeEach(() => {
    databaseConnectionsService = new DatabaseConnectionsService(configService);
    jest.spyOn(databaseConnectionsService, 'verify').mockResolvedValue(undefined);
    databasesRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn(async ({ connection }) => ({ ...record(fields), connection })),
      update: jest.fn(async (_id, { connection }) => ({ ...record(fields), ...(connection && { connection }) })),
      delete: jest.fn(),
      findQueryStats: jest.fn(),
      saveQueryStats: jest.fn(),
    };
    databasesService = new DatabasesService(databasesRepository as unknown as DatabasesRepository, databaseConnectionsService);
  });

  it('verifies and stores the encrypted connection with the default port', async () => {
    const view = await databasesService.create({ name: 'Shop', ...fields, port: undefined });

    expect(databaseConnectionsService.verify).toHaveBeenCalledWith(fields);
    expect(databasesRepository.create.mock.calls[0][0].connection).not.toContain('secret');
    expect(savedConnection()).toEqual(fields);
    expect(view).toEqual({
      id: 'db-1',
      name: 'Shop',
      address: 'reader@db:5432/shop',
      connection: { mode: 'FIELDS', host: 'db', port: 5432, database: 'shop', user: 'reader' },
      analysisCount: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  });

  it('prefers the connection string and never returns it', async () => {
    const connectionString = 'postgresql://reader:secret@db/shop';

    const view = await databasesService.create({ name: 'Shop', ...fields, connectionString });

    expect(savedConnection()).toEqual({ connectionString });
    expect(view.connection).toEqual({ mode: 'URL' });
    expect(JSON.stringify(view)).not.toContain('secret');
  });

  it('stores nothing when the database is unreachable', async () => {
    jest.spyOn(databaseConnectionsService, 'verify').mockRejectedValue(new Error('unreachable'));

    await expect(databasesService.create({ name: 'Shop', ...fields })).rejects.toThrow('unreachable');
    expect(databasesRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicated name', async () => {
    databasesRepository.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' }));

    await expect(codeOf(databasesService.create({ name: 'Shop', ...fields }))).resolves.toEqual({ code: ErrorCode.DATABASE_ALREADY_EXISTS });
  });

  it('rejects a taken name before connecting', async () => {
    databasesRepository.findByName.mockResolvedValue({ id: 'db-2' });

    await expect(codeOf(databasesService.create({ name: 'Shop', ...fields }))).resolves.toEqual({ code: ErrorCode.DATABASE_ALREADY_EXISTS });
    expect(databaseConnectionsService.verify).not.toHaveBeenCalled();
  });

  describe('inspect', () => {
    const connected = [{ type: DatabaseCheckType.CONNECTION, status: DatabaseCheckStatus.PASSED }];

    beforeEach(() => jest.spyOn(databaseConnectionsService, 'inspect').mockResolvedValue(connected));

    it('checks the name, then the connection', async () => {
      await expect(databasesService.inspect({ name: 'Shop', ...fields, port: undefined })).resolves.toEqual({
        checks: [{ type: DatabaseCheckType.NAME, status: DatabaseCheckStatus.PASSED }, ...connected],
      });
      expect(databaseConnectionsService.inspect).toHaveBeenCalledWith(fields);
      expect(databasesRepository.create).not.toHaveBeenCalled();
    });

    it('fails the name check of a taken name', async () => {
      databasesRepository.findByName.mockResolvedValue({ id: 'db-2' });

      const { checks } = await databasesService.inspect({ name: 'Shop', ...fields });

      expect(checks[0]).toEqual({ type: DatabaseCheckType.NAME, status: DatabaseCheckStatus.FAILED, code: ErrorCode.DATABASE_ALREADY_EXISTS });
    });
  });

  it('throws DATABASE_NOT_FOUND for an unknown database', async () => {
    databasesRepository.findById.mockResolvedValue(null);

    await expect(codeOf(databasesService.findOne('missing'))).resolves.toEqual({ code: ErrorCode.DATABASE_NOT_FOUND });
  });

  describe('update', () => {
    beforeEach(() => databasesRepository.findById.mockResolvedValue(record(fields, 2)));

    it('renames without verifying the connection again', async () => {
      await databasesService.update('db-1', { name: 'Shop replica' });

      expect(databaseConnectionsService.verify).not.toHaveBeenCalled();
      expect(databasesRepository.update).toHaveBeenCalledWith('db-1', { name: 'Shop replica', connection: undefined });
    });

    it('keeps its own name, but rejects the name of another database', async () => {
      databasesRepository.findByName.mockResolvedValue({ id: 'db-1' });
      await databasesService.update('db-1', { name: 'Shop' });
      expect(databasesRepository.update).toHaveBeenCalled();

      databasesRepository.findByName.mockResolvedValue({ id: 'db-2' });
      await expect(codeOf(databasesService.update('db-1', { name: 'Other' }))).resolves.toEqual({ code: ErrorCode.DATABASE_ALREADY_EXISTS });
    });

    it('keeps the password of the same server when none is given', async () => {
      await databasesService.update('db-1', { host: 'db', port: 6543, database: 'shop_v2', user: 'reader' });

      expect(savedConnection()).toEqual({ ...fields, port: 6543, database: 'shop_v2' });
    });

    it('drops the password when the server changes', async () => {
      await databasesService.update('db-1', { host: 'other', database: 'shop', user: 'reader' });

      expect(savedConnection()).toEqual({ host: 'other', port: 5432, database: 'shop', user: 'reader', password: undefined });
    });

    it('returns the database unchanged for an empty update', async () => {
      await expect(databasesService.update('db-1', {})).resolves.toMatchObject({ id: 'db-1', analysisCount: 2 });
      expect(databasesRepository.update).not.toHaveBeenCalled();
    });
  });

  it('refuses to delete a database used by analyses', async () => {
    databasesRepository.findById.mockResolvedValue(record(fields, 1));

    await expect(codeOf(databasesService.remove('db-1'))).resolves.toEqual({ code: ErrorCode.DATABASE_IN_USE });
    expect(databasesRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused database', async () => {
    databasesRepository.findById.mockResolvedValue(record(fields));

    await databasesService.remove('db-1');

    expect(databasesRepository.delete).toHaveBeenCalledWith('db-1');
  });

  it('verifies the stored connection of a database', async () => {
    databasesRepository.findById.mockResolvedValue(record(fields));

    await databasesService.verify('db-1');

    expect(databaseConnectionsService.verify).toHaveBeenCalledWith(fields);
  });

  it('saves the current query stats by subject and returns the previous ones', async () => {
    const subject = createQuerySubject('SELECT 1');
    const queries = { [subject.uuid]: { calls: 1, execMs: 2 } };
    databasesRepository.findQueryStats.mockResolvedValue({ databaseId: 'db-1', queries, takenAt: createdAt });

    await expect(databasesService.swapQueryStats('db-1', [{ subject, calls: 5, execMs: 9 }])).resolves.toEqual({ takenAt: createdAt, queries });
    expect(databasesRepository.saveQueryStats).toHaveBeenCalledWith('db-1', {
      queries: { [subject.uuid]: { calls: 5, execMs: 9 } },
      takenAt: expect.any(Date),
    });
  });

  it('has no previous query stats on the first run', async () => {
    databasesRepository.findQueryStats.mockResolvedValue(null);

    await expect(databasesService.swapQueryStats('db-1', [])).resolves.toBeNull();
  });
});
