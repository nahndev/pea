import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { createSubject } from '../../../subjects/subject';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

const DEAD_TUPLES_SQL = `
  SELECT schemaname AS schema, relname AS name, n_dead_tup::float8 AS value
  FROM pg_stat_user_tables
  ORDER BY schemaname, relname
`;

@Injectable()
export class TableDeadTuplesHandler implements MetricHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(_metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema !== AnalysisSchema.DATABASE) return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ schema: string; name: string; value: number }>(DEAD_TUPLES_SQL),
    );
    return rows.map(({ schema, name, value }) => ({ subject: createSubject(SubjectType.TABLE, `${schema}.${name}`), value }));
  }
}
