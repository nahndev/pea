import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import {
  BUG_LOG_GROUP_COLUMN,
  BUG_LOG_MESSAGE_COLUMN,
  BUG_LOG_TS_COLUMN,
  bugLogEvents,
} from '../../../files/bug-log-events';
import { queryRows } from '../../../files/duckdb-query';
import { createSubject } from '../../../subjects/subject';
import { ERROR_GROUP_RULE_BY_TYPE, MAX_BUG_ISSUES, MAX_ISSUE_MESSAGE_LENGTH } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class ErrorGroupHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema !== AnalysisSchema.BUG) return [];
    const definition = ERROR_GROUP_RULE_BY_TYPE.get(rule.type);
    const { minCount } = rule.config as RuleConfig;
    if (!definition || typeof minCount !== 'number') return [];

    const rows = await queryRows(`
      SELECT * FROM (
        SELECT
          ${BUG_LOG_GROUP_COLUMN} AS error_group,
          count(*) FILTER (WHERE ${definition.condition}) AS total,
          arg_max(${BUG_LOG_MESSAGE_COLUMN}, coalesce(${BUG_LOG_TS_COLUMN}, 0)) FILTER (WHERE ${definition.condition} AND ${BUG_LOG_MESSAGE_COLUMN} IS NOT NULL) AS message
        FROM ${bugLogEvents(context.logPath)}
        GROUP BY ${BUG_LOG_GROUP_COLUMN}
      )
      WHERE total >= ${minCount}
      ORDER BY total DESC, error_group ASC
      LIMIT ${MAX_BUG_ISSUES}
    `);

    return rows.map((row) => {
      const message = typeof row.message === 'string' ? `: ${row.message.slice(0, MAX_ISSUE_MESSAGE_LENGTH)}` : '';
      return {
        ruleId: rule.id,
        description: `${definition.describe(Number(row.total))}${message}`,
        subject: createSubject(SubjectType.ERROR, String(row.error_group)),
      };
    });
  }
}
