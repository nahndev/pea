import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { QUERY_STATEMENTS_SQL, createQuerySubject } from '../../../database-connections/postgres-stats';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig, StatementRow, StatementRule } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';
import { STATEMENT_RULE_BY_RULE_TYPE } from './statement-rules.constants';

const buildSql = ({ params, value, detail, condition, order }: StatementRule) => `
  ${QUERY_STATEMENTS_SQL}
  SELECT query, calls, (${value})::float8 AS value, (${detail ?? 'NULL'})::float8 AS detail
  FROM queries CROSS JOIN totals
  WHERE ${condition}
  ORDER BY ${order ?? value} DESC NULLS LAST
  LIMIT $${params.length + 1}
`;

@Injectable()
export class StatementHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const statementRule = STATEMENT_RULE_BY_RULE_TYPE.get(rule.type);
    const config = rule.config as Required<RuleConfig>;
    if (!statementRule || context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];
    const values = statementRule.params.map((field) => config[field]);
    if (values.some((value) => typeof value !== 'number')) return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<StatementRow>(buildSql(statementRule), [...values, MAX_DATABASE_ISSUES]),
    );
    return rows.map((row) => ({ ruleId: rule.id, description: statementRule.describe(row, config), subject: createQuerySubject(row.query) }));
  }
}
