import { Injectable } from '@nestjs/common';
import { AnalysisContextType } from '@tomato/constants';
import type { AnalysisContext, Rule } from '../../../generated/client';
import { API_METRIC_DURATION_COLUMN } from '../../files/api-metric-durations';
import { API_METRIC_ENDPOINT_COLUMN, apiMetricRequests } from '../../files/api-metric-requests';
import { queryRows } from '../../files/duckdb-query';
import { StorageService } from '../../files/storage.service';
import type { RuleConfig } from '../rules.types';
import type { RuleHandler, RuleIssue } from './rule-handler.types';

@Injectable()
export class SlowApiHandler implements RuleHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.type !== AnalysisContextType.API_METRIC) return [];

    const { thresholdMs } = rule.config as RuleConfig;
    if (typeof thresholdMs !== 'number') return [];

    const rows = await queryRows(`
      SELECT ${API_METRIC_ENDPOINT_COLUMN} AS endpoint,
        max(${API_METRIC_DURATION_COLUMN}) AS value
      FROM ${apiMetricRequests(this.storageService.resolve(context.path))}
      GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      HAVING max(${API_METRIC_DURATION_COLUMN}) > ${thresholdMs}
      ORDER BY value DESC
    `);

    return rows.map((row) => ({
      ruleId: rule.id,
      analysisContextId: context.id,
      description: `${String(row.endpoint)} expected less than ${thresholdMs}ms, current max is ${Number(row.value).toFixed(1)}ms`,
    }));
  }
}
