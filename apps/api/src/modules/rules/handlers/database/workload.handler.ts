import { Injectable } from '@nestjs/common';
import { AnalysisSchema, RuleType, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { CURRENT_DATABASE_ID_SQL } from '../../../database-connections/postgres-stats';
import { createSubject } from '../../../subjects/subject';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

/** Shares are only reported when the time is split between several databases or roles. */
const workloadSql = (name: string, from: string) => `
  SELECT name, calls, value FROM (
    SELECT ${name} AS name, sum(s.calls)::float8 AS calls,
      (sum(s.total_exec_time) * 100 / NULLIF(sum(sum(s.total_exec_time)) OVER (), 0))::float8 AS value,
      count(*) OVER () AS groups
    FROM ${from}
    GROUP BY ${name}
  ) w
  WHERE groups > 1 AND value > $1
  ORDER BY value DESC
  LIMIT $2
`;

const WORKLOAD_BY_RULE_TYPE: ReadonlyMap<string, { sql: string; subjectType: SubjectType; label: string }> = new Map([
  [
    RuleType.DATABASE_WORKLOAD,
    {
      sql: workloadSql('d.datname', 'pg_stat_statements s JOIN pg_database d ON d.oid = s.dbid'),
      subjectType: SubjectType.DATABASE,
      label: 'the server',
    },
  ],
  [
    RuleType.ROLE_WORKLOAD,
    {
      sql: workloadSql('r.rolname', `pg_stat_statements s JOIN pg_roles r ON r.oid = s.userid WHERE s.dbid = ${CURRENT_DATABASE_ID_SQL}`),
      subjectType: SubjectType.ROLE,
      label: 'the database',
    },
  ],
]);

@Injectable()
export class WorkloadHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const workload = WORKLOAD_BY_RULE_TYPE.get(rule.type);
    const { maxPercent } = rule.config as RuleConfig;
    if (!workload || context.schema !== AnalysisSchema.DATABASE || !context.isPgStatStatements) return [];
    if (typeof maxPercent !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ name: string; calls: number; value: number }>(workload.sql, [maxPercent, MAX_DATABASE_ISSUES]),
    );
    return rows.map(({ name, calls, value }) => ({
      ruleId: rule.id,
      description: `${value.toFixed(1)}% of the statement execution time of ${workload.label} (${calls} calls), above ${maxPercent}%`,
      subject: createSubject(workload.subjectType, name),
    }));
  }
}
