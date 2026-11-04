import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { BUG_LOG_ENDPOINT_COLUMN, bugLogEvents } from '../../../files/bug-log-events';
import { queryRows } from '../../../files/duckdb-query';
import { createSubject } from '../../../subjects/subject';
import { MAX_BUG_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class ErrorEndpointHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema !== AnalysisSchema.BUG) return [];
    const { minCount } = rule.config as RuleConfig;
    if (typeof minCount !== 'number') return [];

    const rows = await queryRows(`
      SELECT ${BUG_LOG_ENDPOINT_COLUMN} AS endpoint, count(*) AS total, count(*) FILTER (WHERE status BETWEEN 500 AND 599) AS server_errors
      FROM ${bugLogEvents(context.logPath)}
      WHERE ${BUG_LOG_ENDPOINT_COLUMN} IS NOT NULL
      GROUP BY ${BUG_LOG_ENDPOINT_COLUMN}
      HAVING count(*) >= ${minCount}
      ORDER BY total DESC, endpoint ASC
      LIMIT ${MAX_BUG_ISSUES}
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      description: `${Number(row.total)} errors raised, ${Number(row.server_errors)} with a 5xx status`,
      subject: createSubject(SubjectType.API, String(row.endpoint)),
    }));
  }
}
