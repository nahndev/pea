import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { API_METRIC_ENDPOINT_COLUMN, apiMetricRequests } from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { createSubject } from '../../../subjects/subject';
import { DEFAULT_MIN_REQUESTS, SERVER_ERROR_CONDITION } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class RouteErrorRateHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema === AnalysisSchema.DATABASE) return [];
    const { maxPercent, minRequests = DEFAULT_MIN_REQUESTS } = rule.config as RuleConfig;
    if (typeof maxPercent !== 'number' || typeof minRequests !== 'number') return [];

    const rows = await queryRows(`
      SELECT * FROM (
        SELECT ${API_METRIC_ENDPOINT_COLUMN} AS endpoint, count(*) AS total, count(*) FILTER (WHERE ${SERVER_ERROR_CONDITION}) * 100.0 / count(*) AS value
        FROM ${apiMetricRequests(context.logPath)}
        GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      )
      WHERE total >= ${minRequests} AND value > ${maxPercent}
      ORDER BY value DESC
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      description: `5xx error rate ${Number(row.value).toFixed(1)}% exceeds threshold ${maxPercent}%`,
      subject: createSubject(SubjectType.API, String(row.endpoint)),
    }));
  }
}
