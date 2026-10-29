import { Injectable } from '@nestjs/common';
import type { Analysis, Rule } from '../../../generated/client';
import { apiMetricRequests } from '../../files/api-metric-requests';
import { queryRows } from '../../files/duckdb-query';
import { StorageService } from '../../files/storage.service';
import { RATE_BY_RULE_TYPE } from '../rules.constants';
import type { RuleConfig } from '../rules.types';
import type { RuleHandler, RuleIssue } from './rule-handler.types';

@Injectable()
export class RateHandler implements RuleHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(rule: Rule, analysis: Analysis): Promise<RuleIssue[]> {
    const rate = RATE_BY_RULE_TYPE.get(rule.type);
    const config = rule.config as RuleConfig;
    const condition = rate?.condition(config);
    if (!rate || !condition || typeof config.maxPercent !== 'number') return [];

    const [row] = await queryRows(
      `SELECT count(*) AS total, count(*) FILTER (WHERE ${condition}) AS matched FROM ${apiMetricRequests(this.storageService.resolve(analysis.path))}`,
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
