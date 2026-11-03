import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { createSubject } from '../../../subjects/subject';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

/** Unique and primary key indexes enforce constraints, so they are never reported. */
const UNUSED_INDEXES_SQL = `
  SELECT s.schemaname AS schema, s.indexrelname AS name, s.relname AS "table", pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  JOIN pg_stat_user_tables t ON t.relid = s.relid
  WHERE s.idx_scan = 0 AND NOT i.indisunique AND NOT i.indisprimary AND t.n_live_tup >= $1
  ORDER BY pg_relation_size(s.indexrelid) DESC
  LIMIT $2
`;

@Injectable()
export class UnusedIndexHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { minRows } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || typeof minRows !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ schema: string; name: string; table: string; size: string }>(UNUSED_INDEXES_SQL, [minRows, MAX_DATABASE_ISSUES]),
    );
    return rows.map(({ schema, name, table, size }) => ({
      ruleId: rule.id,
      description: `Never scanned since statistics reset (${size} on ${schema}.${table})`,
      subject: createSubject(SubjectType.INDEX, `${schema}.${name}`),
    }));
  }
}
