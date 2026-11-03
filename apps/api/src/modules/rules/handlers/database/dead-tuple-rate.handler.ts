import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { createSubject } from '../../../subjects/subject';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const DEAD_TUPLE_RATES_SQL = `
  SELECT schemaname AS schema, relname AS name, n_dead_tup::float8 AS dead, (n_live_tup + n_dead_tup)::float8 AS total,
    (n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0))::float8 AS percent
  FROM pg_stat_user_tables
  WHERE n_live_tup + n_dead_tup >= $2 AND n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0) > $1
  ORDER BY percent DESC
  LIMIT $3
`;

@Injectable()
export class DeadTupleRateHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { maxPercent, minRows } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || typeof maxPercent !== 'number' || typeof minRows !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ schema: string; name: string; dead: number; total: number; percent: number }>(DEAD_TUPLE_RATES_SQL, [
        maxPercent,
        minRows,
        MAX_DATABASE_ISSUES,
      ]),
    );
    return rows.map(({ schema, name, dead, total, percent }) => ({
      ruleId: rule.id,
      description: `Dead tuples ${percent.toFixed(1)}% (${dead} of ${total} rows) exceeds ${maxPercent}%`,
      subject: createSubject(SubjectType.TABLE, `${schema}.${name}`),
    }));
  }
}
