import { AnalysisSchema, ErrorCode } from '@tomato/constants';
import { NotFoundException } from '@nestjs/common';
import type { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import type { StorageService } from '../files/storage.service';
import { AnalysisContextFactory } from './analysis-context.factory';
import type { AnalysisWithData } from './analyses.types';

describe('AnalysisContextFactory', () => {
  const connection = { connectionString: 'postgresql://reader@db/shop' };
  let query: jest.Mock;
  let databaseConnectionsService: jest.Mocked<Pick<DatabaseConnectionsService, 'decrypt' | 'withClient'>>;
  let analysisContextFactory: AnalysisContextFactory;

  beforeEach(() => {
    query = jest.fn().mockResolvedValueOnce({ rows: [{ isInstalled: true }] }).mockResolvedValueOnce({ rows: [] });
    databaseConnectionsService = {
      decrypt: jest.fn().mockReturnValue(connection),
      withClient: jest.fn((_connection, use) => use({ query } as never)) as never,
    };
    const storageService = { resolve: (path: string | null) => `/uploads/${path}` };
    analysisContextFactory = new AnalysisContextFactory(
      storageService as unknown as StorageService,
      databaseConnectionsService as unknown as DatabaseConnectionsService,
    );
  });

  it('resolves the log of a file analysis', async () => {
    const analysis = { schema: AnalysisSchema.API, apiData: { path: 'p-1' } } as AnalysisWithData;

    await expect(analysisContextFactory.create(analysis)).resolves.toEqual({ schema: AnalysisSchema.API, logPath: '/uploads/p-1' });
    expect(databaseConnectionsService.withClient).not.toHaveBeenCalled();
  });

  it('decrypts the connection and probes pg_stat_statements once for a database analysis', async () => {
    const analysis = { schema: AnalysisSchema.DATABASE, databaseData: { database: { connection: 'sealed' } } } as AnalysisWithData;

    await expect(analysisContextFactory.create(analysis)).resolves.toEqual({
      schema: AnalysisSchema.DATABASE,
      connection,
      isPgStatStatements: true,
    });
    expect(databaseConnectionsService.decrypt).toHaveBeenCalledWith('sealed');
    expect(databaseConnectionsService.withClient).toHaveBeenCalledTimes(1);
  });

  it('throws DATABASE_NOT_FOUND for a database analysis without its database', async () => {
    const error = await analysisContextFactory
      .create({ schema: AnalysisSchema.DATABASE, databaseData: null } as AnalysisWithData)
      .catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.DATABASE_NOT_FOUND });
  });
});
