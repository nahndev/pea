import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import {
  API_METRIC_DURATION_COLUMN,
  API_METRIC_ENDPOINT_COLUMN,
  apiMetricRequests,
} from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { createSubject } from '../../../subjects/subject';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class SlowApiHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema === AnalysisSchema.DATABASE) return [];
    const { thresholdMs } = rule.config as RuleConfig;
    if (typeof thresholdMs !== 'number') return [];

    const rows = await queryRows(`
      SELECT ${API_METRIC_ENDPOINT_COLUMN} AS endpoint,
        max(${API_METRIC_DURATION_COLUMN}) AS value
      FROM ${apiMetricRequests(context.logPath)}
      GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      HAVING max(${API_METRIC_DURATION_COLUMN}) > ${thresholdMs}
      ORDER BY value DESC
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      description: `Expected less than ${thresholdMs}ms, current max is ${Number(row.value).toFixed(1)}ms`,
      subject: createSubject(SubjectType.API, String(row.endpoint)),
    }));
  }
}
