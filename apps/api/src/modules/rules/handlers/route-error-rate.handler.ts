import { Injectable } from '@nestjs/common';
import { AnalysisContextType } from '@tomato/constants';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { API_METRIC_ENDPOINT_COLUMN, apiMetricRequests } from '../../files/api-metric-requests';
import { queryRows } from '../../files/duckdb-query';
import { StorageService } from '../../files/storage.service';
import { DEFAULT_MIN_REQUESTS, SERVER_ERROR_CONDITION } from '../rules.constants';
import type { RuleConfig } from '../rules.types';
import type { RuleHandler, RuleIssue } from './rule-handler.types';

@Injectable()
export class RouteErrorRateHandler implements RuleHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.type !== AnalysisContextType.API_METRIC) return [];

    const { maxPercent, minRequests = DEFAULT_MIN_REQUESTS } = rule.config as RuleConfig;
    if (typeof maxPercent !== 'number' || typeof minRequests !== 'number') return [];

    const rows = await queryRows(`
      SELECT * FROM (
        SELECT ${API_METRIC_ENDPOINT_COLUMN} AS endpoint, count(*) AS total, count(*) FILTER (WHERE ${SERVER_ERROR_CONDITION}) * 100.0 / count(*) AS value
        FROM ${apiMetricRequests(this.storageService.resolve(context.path))}
        GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      )
      WHERE total >= ${minRequests} AND value > ${maxPercent}
      ORDER BY value DESC
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      analysisContextId: context.id,
      description: `${String(row.endpoint)} 5xx error rate ${Number(row.value).toFixed(1)}% exceeds threshold ${maxPercent}%`,
    }));
  }
}
