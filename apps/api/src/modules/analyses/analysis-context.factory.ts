import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalysisSchema, ErrorCode } from '@tomato/constants';
import { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import { hasPgStatStatements, readQueryStats } from '../database-connections/postgres-stats';
import { DatabasesService } from '../databases/databases.service';
import { StorageService } from '../files/storage.service';
import type { AnalysisContext, AnalysisWithData } from './analyses.types';

@Injectable()
export class AnalysisContextFactory {
  constructor(
    private readonly storageService: StorageService,
    private readonly databaseConnectionsService: DatabaseConnectionsService,
    private readonly databasesService: DatabasesService,
  ) {}

  async create(analysis: AnalysisWithData): Promise<AnalysisContext> {
    const schema = analysis.schema as AnalysisSchema;
    if (schema !== AnalysisSchema.DATABASE) return { schema, logPath: this.storageService.resolve(analysis.apiData?.path ?? null) };
    if (!analysis.databaseData) throw new NotFoundException({ code: ErrorCode.DATABASE_NOT_FOUND });

    const connection = this.databaseConnectionsService.decrypt(analysis.databaseData.database.connection);
    const { isPgStatStatements, current } = await this.databaseConnectionsService.withClient(connection, async (client) => {
      const isPgStatStatements = await hasPgStatStatements(client);
      return { isPgStatStatements, current: isPgStatStatements ? await readQueryStats(client) : [] };
    });
    const previous = isPgStatStatements ? await this.databasesService.swapQueryStats(analysis.databaseData.databaseId, current) : null;
    return { schema, connection, isPgStatStatements, queryStats: { current, previous } };
  }
}
