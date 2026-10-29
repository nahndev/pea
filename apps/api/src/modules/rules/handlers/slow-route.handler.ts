import { Injectable } from '@nestjs/common';
import { AnalysisContextType } from '@tomato/constants';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { API_METRIC_DURATION_COLUMN } from '../../files/api-metric-durations';
import { API_METRIC_ENDPOINT_COLUMN, apiMetricRequests } from '../../files/api-metric-requests';
import { queryRows } from '../../files/duckdb-query';
import { StorageService } from '../../files/storage.service';
import { DEFAULT_MIN_REQUESTS, ROUTE_PERCENTILE } from '../rules.constants';
import type { RuleConfig } from '../rules.types';
import type { RuleHandler, RuleIssue } from './rule-handler.types';

@Injectable()
export class SlowRouteHandler implements RuleHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.type !== AnalysisContextType.API_METRIC) return [];

    const { thresholdMs, minRequests = DEFAULT_MIN_REQUESTS } = rule.config as RuleConfig;
    if (typeof thresholdMs !== 'number' || typeof minRequests !== 'number') return [];

    const rows = await queryRows(`
      SELECT * FROM (
        SELECT ${API_METRIC_ENDPOINT_COLUMN} AS endpoint, count(*) AS total, quantile_cont(${API_METRIC_DURATION_COLUMN}, ${ROUTE_PERCENTILE}) AS value
        FROM ${apiMetricRequests(this.storageService.resolve(context.path))}
        GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      )
      WHERE total >= ${minRequests} AND value > ${thresholdMs}
      ORDER BY value DESC
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      analysisContextId: context.id,
      description: `${String(row.endpoint)} P95 ${Number(row.value).toFixed(1)}ms exceeds threshold ${thresholdMs}ms`,
    }));
  }
}
