import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { CURRENT_DATABASE_ID_SQL, createQuerySubject } from '../../../database-connections/postgres-stats';
import { MAX_QUERY_SUBJECTS } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

const QUERY_MEAN_DURATIONS_SQL = `
  SELECT query, (sum(total_exec_time) / NULLIF(sum(calls), 0))::float8 AS value
  FROM pg_stat_statements
  WHERE dbid = ${CURRENT_DATABASE_ID_SQL} AND query <> '<insufficient privilege>'
  GROUP BY query
  HAVING sum(calls) > 0
  ORDER BY sum(total_exec_time) DESC
  LIMIT $1
`;

@Injectable()
export class QueryMeanDurationHandler implements MetricHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(_metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ query: string; value: number }>(QUERY_MEAN_DURATIONS_SQL, [MAX_QUERY_SUBJECTS]),
    );
    const measurements = new Map<string, MetricMeasurement>();
    for (const { query, value } of rows) {
      const subject = createQuerySubject(query);
      if (!measurements.has(subject.uuid)) measurements.set(subject.uuid, { subject, value });
    }
    return [...measurements.values()];
  }
}
