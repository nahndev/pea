import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { queryRows } from '../../../files/duckdb-query';
import { FRONTEND_PAGE_COLUMN, frontendPageLoads } from '../../../files/frontend-page-loads';
import { createSubject } from '../../../subjects/subject';
import { MAX_FRONTEND_ISSUES, PAGE_RULE_BY_TYPE } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class PageRuleHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema !== AnalysisSchema.FRONTEND) return [];
    const definition = PAGE_RULE_BY_TYPE.get(rule.type);
    const config = rule.config as RuleConfig;
    const limit = definition ? config[definition.limit] : undefined;
    if (!definition || typeof limit !== 'number' || typeof config.minLoads !== 'number') return [];

    const rows = await queryRows(`
      SELECT * FROM (
        SELECT ${FRONTEND_PAGE_COLUMN} AS page, count(*) AS total, ${definition.value} AS value
        FROM ${frontendPageLoads(context.logPath)}
        WHERE ${FRONTEND_PAGE_COLUMN} IS NOT NULL
        GROUP BY ${FRONTEND_PAGE_COLUMN}
      )
      WHERE total >= ${config.minLoads} AND value > ${limit}
      ORDER BY value DESC, page ASC
      LIMIT ${MAX_FRONTEND_ISSUES}
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      description: definition.describe(Number(row.value), limit),
      subject: createSubject(SubjectType.PAGE, String(row.page)),
    }));
  }
}
