import { Injectable } from '@nestjs/common';
import { SubjectType } from '@tomato/constants';
import { escapeIdentifier } from 'pg';
import type { Metric } from '../../../generated/client';
import type { AnalysisWithData } from '../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../database-connections/database-connections.service';
import { createSubject } from '../../subjects/subject';
import type { MetricHandler, MetricMeasurement } from './metric-handler.types';

const READABLE_TABLES_SQL = `
  SELECT n.nspname AS schema, c.relname AS name
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p')
    AND NOT c.relispartition
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg\\_toast%'
    AND n.nspname NOT LIKE 'pg\\_temp%'
    AND has_table_privilege(c.oid, 'SELECT')
  ORDER BY n.nspname, c.relname
`;

@Injectable()
export class TableRowsHandler implements MetricHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(_metric: Metric, analysis: AnalysisWithData): Promise<MetricMeasurement[]> {
    if (!analysis.databaseData) return [];

    const connection = this.databaseConnectionsService.decrypt(analysis.databaseData.connection);
    return this.databaseConnectionsService.withClient(connection, async (client) => {
      const { rows: tables } = await client.query<{ schema: string; name: string }>(READABLE_TABLES_SQL);
      const measurements: MetricMeasurement[] = [];
      for (const { schema, name } of tables) {
        const { rows } = await client.query<{ count: string }>(
          `SELECT count(*) AS count FROM ${escapeIdentifier(schema)}.${escapeIdentifier(name)}`,
        );
        measurements.push({ subject: createSubject(SubjectType.TABLE, `${schema}.${name}`), value: Number(rows[0].count) });
      }
      return measurements;
    });
  }
}
