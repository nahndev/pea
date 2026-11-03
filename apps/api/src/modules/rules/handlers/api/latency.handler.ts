import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { API_METRIC_DURATION_COLUMN, apiMetricRequests } from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { LATENCY_STAT_BY_RULE_TYPE } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class LatencyHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema === AnalysisSchema.DATABASE) return [];
    const stat = LATENCY_STAT_BY_RULE_TYPE.get(rule.type);
    const { thresholdMs } = rule.config as RuleConfig;
    if (!stat || typeof thresholdMs !== 'number') return [];

    const [row] = await queryRows(
      `SELECT ${stat.sql(API_METRIC_DURATION_COLUMN)} AS value FROM ${apiMetricRequests(context.logPath)}`,
    );
    if (row?.value === null || row?.value === undefined) return [];

    const value = Number(row.value);
    if (value <= thresholdMs) return [];

    return [
      {
        ruleId: rule.id,
        description: `${stat.label} ${value.toFixed(1)}ms exceeds threshold ${thresholdMs}ms`,
      },
    ];
  }
}
