import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { CURRENT_DATABASE_ID_SQL, createQuerySubject } from '../../../database-connections/postgres-stats';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

/** Parameter lists and numbers in names (`IN ($1, $2)`, `tmp_42`) are collapsed so their variants share one shape. */
const QUERY_VARIANTS_SQL = String.raw`
  SELECT shape, count(DISTINCT queryid)::float8 AS variants, sum(calls)::float8 AS calls
  FROM (
    SELECT queryid, calls,
      lower(regexp_replace(regexp_replace(regexp_replace(query, '\$\d+(\s*,\s*\$\d+)*', '$', 'g'), '\d+', '0', 'g'), '\s+', ' ', 'g')) AS shape
    FROM pg_stat_statements
    WHERE dbid = ${CURRENT_DATABASE_ID_SQL} AND query <> '<insufficient privilege>'
  ) s
  GROUP BY shape
  HAVING count(DISTINCT queryid) > $1
  ORDER BY variants DESC
  LIMIT $2
`;

@Injectable()
export class QueryVariantsHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { maxItems } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];
    if (typeof maxItems !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ shape: string; variants: number; calls: number }>(QUERY_VARIANTS_SQL, [maxItems, MAX_DATABASE_ISSUES]),
    );
    return rows.map(({ shape, variants, calls }) => ({
      ruleId: rule.id,
      description: `${variants} query ids (${calls} calls) share this shape, above ${maxItems}; use = ANY($1) or stable identifiers`,
      subject: createQuerySubject(shape),
    }));
  }
}
