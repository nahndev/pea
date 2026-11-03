import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { CURRENT_DATABASE_ID_SQL, createQuerySubject } from '../../../database-connections/postgres-stats';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const SLOW_QUERIES_SQL = `
  SELECT query, sum(calls)::float8 AS calls, (sum(total_exec_time) / sum(calls))::float8 AS "meanMs"
  FROM pg_stat_statements
  WHERE dbid = ${CURRENT_DATABASE_ID_SQL} AND query <> '<insufficient privilege>'
  GROUP BY query
  HAVING sum(calls) >= $2 AND sum(total_exec_time) / sum(calls) > $1
  ORDER BY "meanMs" DESC
  LIMIT $3
`;

@Injectable()
export class SlowQueryHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { thresholdMs, minCalls } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];
    if (typeof thresholdMs !== 'number' || typeof minCalls !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ query: string; calls: number; meanMs: number }>(SLOW_QUERIES_SQL, [thresholdMs, minCalls, MAX_DATABASE_ISSUES]),
    );
    return rows.map(({ query, calls, meanMs }) => ({
      ruleId: rule.id,
      description: `Mean ${meanMs.toFixed(1)}ms over ${calls} calls exceeds threshold ${thresholdMs}ms`,
      subject: createQuerySubject(query),
    }));
  }
}
