import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const STATEMENT_COUNT_SQL = `
  SELECT count(*)::float8 AS count, current_setting('pg_stat_statements.max')::float8 AS max,
    to_regclass('pg_stat_statements_info') IS NOT NULL AS "isInfo"
  FROM pg_stat_statements
`;

/** PostgreSQL 14+ */
const DEALLOC_SQL = 'SELECT dealloc::float8 AS dealloc FROM pg_stat_statements_info';

@Injectable()
export class StatementEvictionHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { maxPercent } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];
    if (typeof maxPercent !== 'number') return [];

    const { count, max, dealloc } = await this.databaseConnectionsService.withClient(context.connection, async (client) => {
      const { rows } = await client.query<{ count: number; max: number; isInfo: boolean }>(STATEMENT_COUNT_SQL);
      const { count, max, isInfo } = rows[0];
      const info = isInfo ? await client.query<{ dealloc: number }>(DEALLOC_SQL) : null;
      return { count, max, dealloc: info?.rows[0]?.dealloc ?? 0 };
    });
    const percent = (count * 100) / max;
    if (!dealloc && percent <= maxPercent) return [];
    return [
      {
        ruleId: rule.id,
        description: `${count} of ${max} statements tracked (${percent.toFixed(1)}%), ${dealloc} evictions since reset; raise pg_stat_statements.max`,
      },
    ];
  }
}
