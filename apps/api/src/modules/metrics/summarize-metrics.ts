import { MetricConditionAggregate, type MetricConditionOperator, MetricEvaluationStatus, type MetricType } from '@tomato/constants';
import type { MetricSummaryView } from '@tomato/types';
import type { MetricResultSummarySource } from './metric-results.repository';

export function summarizeMetrics(types: readonly MetricType[], results: MetricResultSummarySource[]): MetricSummaryView[] {
  return types.flatMap((type) => {
    const ofType = results.filter(({ metric }) => metric.type === type);
    if (ofType.length === 0) return [];

    const evaluations = ofType.flatMap(({ evaluations: items }) => items);
    const gateStatus = evaluations.some(({ status }) => status === MetricEvaluationStatus.FAILED)
      ? MetricEvaluationStatus.FAILED
      : evaluations.length > 0
        ? MetricEvaluationStatus.PASSED
        : null;
    const first = evaluations.find(({ aggregate }) => aggregate === MetricConditionAggregate.NONE);

    return [
      {
        type,
        worstValue: Math.max(...ofType.map(({ value }) => value)),
        gateStatus,
        limit: first ? { operator: first.operator as MetricConditionOperator, threshold: first.threshold } : null,
      },
    ];
  });
}
