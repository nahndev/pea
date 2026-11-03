import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const LONG_RUNNING_QUERIES_SQL = `
  SELECT pid, state, query, (extract(epoch FROM now() - query_start) * 1000)::float8 AS "durationMs"
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND backend_type = 'client backend'
    AND pid <> pg_backend_pid()
    AND state <> 'idle'
    AND query_start < now() - make_interval(secs => $1::float8 / 1000)
  ORDER BY query_start
  LIMIT $2
`;

@Injectable()
export class LongRunningQueryHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { thresholdMs } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || typeof thresholdMs !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ pid: number; state: string; query: string; durationMs: number }>(LONG_RUNNING_QUERIES_SQL, [thresholdMs, MAX_DATABASE_ISSUES]),
    );
    return rows.map(({ pid, state, query, durationMs }) => ({
      ruleId: rule.id,
      description: `Running for ${durationMs.toFixed(0)}ms (${state}, pid ${pid}) exceeds threshold ${thresholdMs}ms`,
      subject: createQuerySubject(query),
    }));
  }
}
