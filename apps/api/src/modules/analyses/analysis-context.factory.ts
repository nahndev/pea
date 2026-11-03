import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalysisSchema, ErrorCode } from '@tomato/constants';
import { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import { hasPgStatStatements } from '../database-connections/postgres-stats';
import { StorageService } from '../files/storage.service';
import type { AnalysisContext, AnalysisWithData } from './analyses.types';

@Injectable()
export class AnalysisContextFactory {
  constructor(
    private readonly storageService: StorageService,
    private readonly databaseConnectionsService: DatabaseConnectionsService,
  ) {}

  async create(analysis: AnalysisWithData): Promise<AnalysisContext> {
    const schema = analysis.schema as AnalysisSchema;
    if (schema !== AnalysisSchema.DATABASE) return { schema, logPath: this.storageService.resolve(analysis.apiData?.path ?? null) };
    if (!analysis.databaseData) throw new NotFoundException({ code: ErrorCode.DATABASE_NOT_FOUND });

    const connection = this.databaseConnectionsService.decrypt(analysis.databaseData.database.connection);
    const isPgStatStatements = await this.databaseConnectionsService.withClient(connection, hasPgStatStatements);
    return { schema, connection, isPgStatStatements };
  }
}
