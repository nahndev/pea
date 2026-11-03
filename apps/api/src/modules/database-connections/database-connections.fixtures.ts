import { AnalysisSchema } from '@tomato/constants';
import type { Client } from 'pg';
import type { ApiAnalysisContext, DatabaseAnalysisContext } from '../analyses/analyses.types';
import type { DatabaseConnectionsService } from './database-connections.service';

export const DATABASE_CONTEXT: DatabaseAnalysisContext = {
  schema: AnalysisSchema.DATABASE,
  connection: { connectionString: 'postgresql://reader@db/shop' },
  isPgStatStatements: true,
};

export const API_CONTEXT: ApiAnalysisContext = { schema: AnalysisSchema.API, logPath: '/uploads/api_metric.log' };

/** Runs every client callback against `query`. */
export const mockDatabaseConnections = (query: jest.Mock) =>
  ({
    withClient: jest.fn((_connection, use: (client: Client) => Promise<unknown>) => use({ query } as unknown as Client)),
  }) as unknown as DatabaseConnectionsService;
