import { Injectable } from '@nestjs/common';
import { SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisWithData } from '../../../analyses/analyses.types';
import {
  API_METRIC_DURATION_COLUMN,
  API_METRIC_ENDPOINT_COLUMN,
  apiMetricRequests,
} from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { StorageService } from '../../../files/storage.service';
import { createSubject } from '../../../subjects/subject';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class SlowApiHandler implements RuleHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(rule: Rule, analysis: AnalysisWithData): Promise<RuleIssue[]> {
    const { thresholdMs } = rule.config as RuleConfig;
    if (typeof thresholdMs !== 'number') return [];

    const rows = await queryRows(`
      SELECT ${API_METRIC_ENDPOINT_COLUMN} AS endpoint,
        max(${API_METRIC_DURATION_COLUMN}) AS value
      FROM ${apiMetricRequests(this.storageService.resolve(analysis.apiData?.path ?? null))}
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
