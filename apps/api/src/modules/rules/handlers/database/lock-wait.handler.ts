import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const LOCK_WAITS_SQL = `
  SELECT a.pid, a.query, l.mode, coalesce(l.relation::regclass::text, l.locktype) AS target,
    (extract(epoch FROM now() - a.query_start) * 1000)::float8 AS "durationMs",
    pg_blocking_pids(a.pid) AS "blockedBy"
  FROM pg_locks l
  JOIN pg_stat_activity a ON a.pid = l.pid
  WHERE NOT l.granted
    AND a.datname = current_database()
    AND a.query_start < now() - make_interval(secs => $1::float8 / 1000)
  ORDER BY a.query_start
  LIMIT $2
`;

@Injectable()
export class LockWaitHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { thresholdMs } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || typeof thresholdMs !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ pid: number; query: string; mode: string; target: string; durationMs: number; blockedBy: number[] }>(LOCK_WAITS_SQL, [
        thresholdMs,
        MAX_DATABASE_ISSUES,
      ]),
    );
    return rows.map(({ pid, query, mode, target, durationMs, blockedBy }) => ({
      ruleId: rule.id,
      description: `Waiting for ${mode} on ${target} for ${durationMs.toFixed(0)}ms (pid ${pid}${blockedBy.length ? `, blocked by ${blockedBy.join(', ')}` : ''})`,
      subject: createQuerySubject(query),
    }));
  }
}
