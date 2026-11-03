import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { apiMetricRequests } from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { RATE_BY_RULE_TYPE } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class RateHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.schema === AnalysisSchema.DATABASE) return [];
    const rate = RATE_BY_RULE_TYPE.get(rule.type);
    const config = rule.config as RuleConfig;
    const condition = rate?.condition(config);
    if (!rate || !condition || typeof config.maxPercent !== 'number') return [];

    const [row] = await queryRows(
      `SELECT count(*) AS total, count(*) FILTER (WHERE ${condition}) AS matched FROM ${apiMetricRequests(context.logPath)}`,
    );
    const total = Number(row?.total ?? 0);
    if (total === 0) return [];

    const percent = (Number(row?.matched) * 100) / total;
    if (percent <= config.maxPercent) return [];

    return [
      {
        ruleId: rule.id,
        description: `${rate.label(config)} ${percent.toFixed(1)}% exceeds threshold ${config.maxPercent}%`,
      },
    ];
  }
}
