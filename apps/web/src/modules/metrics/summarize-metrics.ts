import { MetricEvaluationStatus, MetricType } from '@tomato/constants';
import type { MetricConditionOperator } from '@tomato/constants';
import type { MetricResultView } from '@tomato/types';
import { METRIC_TYPES } from './metrics.constants';

export interface MetricSummary {
  type: MetricType;
  worstValue: number;
  gateStatus: MetricEvaluationStatus | null;
  limit: { operator: MetricConditionOperator; threshold: number } | null;
}

export function summarizeMetrics(results: MetricResultView[]): MetricSummary[] {
  return METRIC_TYPES.flatMap((type) => {
    const ofType = results.filter(({ metric }) => metric.type === type);
    if (ofType.length === 0) return [];

    const evaluations = ofType.flatMap(({ evaluations: items }) => items);
    const gateStatus = evaluations.some(({ status }) => status === MetricEvaluationStatus.FAILED)
      ? MetricEvaluationStatus.FAILED
      : evaluations.length > 0
        ? MetricEvaluationStatus.PASSED
        : null;
    const first = evaluations[0];

    return [
      {
        type,
        worstValue: Math.max(...ofType.map(({ value }) => value)),
        gateStatus,
        limit: first ? { operator: first.operator, threshold: first.threshold } : null,
      },
    ];
  });
}
