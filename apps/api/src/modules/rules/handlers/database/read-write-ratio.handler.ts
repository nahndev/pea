import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { CURRENT_DATABASE_ID_SQL } from '../../../database-connections/postgres-stats';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const WRITE_PATTERN = String.raw`'^\s*(insert|update|delete|merge)\y'`;
const READ_WRITE_CALLS_SQL = String.raw`
  SELECT
    coalesce(sum(calls) FILTER (WHERE NOT is_write AND query ~* '^\s*(select|with|table|values)\y'), 0)::float8 AS reads,
    coalesce(sum(calls) FILTER (WHERE is_write), 0)::float8 AS writes
  FROM (
    SELECT query, calls, query ~* ${WRITE_PATTERN} OR (query ~* '^\s*with\y' AND query ~* '\y(insert|update|delete|merge)\y') AS is_write
    FROM pg_stat_statements
    WHERE dbid = ${CURRENT_DATABASE_ID_SQL} AND query <> '<insufficient privilege>'
  ) s
`;

@Injectable()
export class ReadWriteRatioHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { maxPercent } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];
    if (typeof maxPercent !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ reads: number; writes: number }>(READ_WRITE_CALLS_SQL),
    );
    const { reads, writes } = rows[0];
    const percent = (writes * 100) / (reads + writes);
    if (!(percent > maxPercent)) return [];
    return [
      {
        ruleId: rule.id,
        description: `Writes are ${percent.toFixed(1)}% of ${reads + writes} calls (${reads} reads, ${writes} writes), above ${maxPercent}%`,
      },
    ];
  }
}
