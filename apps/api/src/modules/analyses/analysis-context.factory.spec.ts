import { AnalysisSchema, ErrorCode } from '@tomato/constants';
import { NotFoundException } from '@nestjs/common';
import type { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import { createQuerySubject } from '../database-connections/postgres-stats';
import type { DatabasesService } from '../databases/databases.service';
import type { StorageService } from '../files/storage.service';
import { AnalysisContextFactory } from './analysis-context.factory';
import type { AnalysisWithData } from './analyses.types';

describe('AnalysisContextFactory', () => {
  const connection = { connectionString: 'postgresql://reader@db/shop' };
  let query: jest.Mock;
  const previous = { takenAt: new Date('2026-11-01T00:00:00Z'), queries: {} };
  let databaseConnectionsService: jest.Mocked<Pick<DatabaseConnectionsService, 'decrypt' | 'withClient'>>;
  let databasesService: jest.Mocked<Pick<DatabasesService, 'swapQueryStats'>>;
  let analysisContextFactory: AnalysisContextFactory;

  beforeEach(() => {
    query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ isInstalled: true }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ query: 'SELECT 1', calls: 3, execMs: 12 }] });
    databaseConnectionsService = {
      decrypt: jest.fn().mockReturnValue(connection),
      withClient: jest.fn((_connection, use) => use({ query } as never)) as never,
    };
    databasesService = { swapQueryStats: jest.fn().mockResolvedValue(previous) };
    const storageService = { resolve: (path: string | null) => `/uploads/${path}` };
    analysisContextFactory = new AnalysisContextFactory(
      storageService as unknown as StorageService,
      databaseConnectionsService as unknown as DatabaseConnectionsService,
      databasesService as unknown as DatabasesService,
    );
  });

  it('resolves the log of a file analysis', async () => {
    const analysis = { schema: AnalysisSchema.API, apiData: { path: 'p-1' } } as AnalysisWithData;

    await expect(analysisContextFactory.create(analysis)).resolves.toEqual({ schema: AnalysisSchema.API, logPath: '/uploads/p-1' });
    expect(databaseConnectionsService.withClient).not.toHaveBeenCalled();
  });

  it('decrypts the connection, probes pg_stat_statements and swaps the query stats once for a database analysis', async () => {
    const analysis = { schema: AnalysisSchema.DATABASE, databaseData: { databaseId: 'd-1', database: { connection: 'sealed' } } } as AnalysisWithData;
    const current = [{ subject: createQuerySubject('SELECT 1'), calls: 3, execMs: 12 }];

    await expect(analysisContextFactory.create(analysis)).resolves.toEqual({
      schema: AnalysisSchema.DATABASE,
      connection,
      isPgStatStatements: true,
      queryStats: { current, previous },
    });
    expect(databaseConnectionsService.decrypt).toHaveBeenCalledWith('sealed');
    expect(databaseConnectionsService.withClient).toHaveBeenCalledTimes(1);
    expect(databasesService.swapQueryStats).toHaveBeenCalledWith('d-1', current);
  });

  it('keeps no query stats without pg_stat_statements', async () => {
    query.mockReset().mockResolvedValueOnce({ rows: [{ isInstalled: false }] });
    const analysis = { schema: AnalysisSchema.DATABASE, databaseData: { databaseId: 'd-1', database: { connection: 'sealed' } } } as AnalysisWithData;

    await expect(analysisContextFactory.create(analysis)).resolves.toMatchObject({
      isPgStatStatements: false,
      queryStats: { current: [], previous: null },
    });
    expect(databasesService.swapQueryStats).not.toHaveBeenCalled();
  });

  it('throws DATABASE_NOT_FOUND for a database analysis without its database', async () => {
    const error = await analysisContextFactory
      .create({ schema: AnalysisSchema.DATABASE, databaseData: null } as AnalysisWithData)
      .catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.DATABASE_NOT_FOUND });
  });
});
