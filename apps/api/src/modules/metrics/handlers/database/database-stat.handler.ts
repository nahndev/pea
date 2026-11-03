import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { DATABASE_STAT_SQL_BY_METRIC_TYPE } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

@Injectable()
export class DatabaseStatHandler implements MetricHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    const sql = DATABASE_STAT_SQL_BY_METRIC_TYPE.get(metric.type);
    if (!sql || context.schema !== AnalysisSchema.DATABASE) return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) => client.query<{ value: number | null }>(sql));
    const value = rows[0]?.value;
    return value === null || value === undefined ? [] : [{ value }];
  }
}
