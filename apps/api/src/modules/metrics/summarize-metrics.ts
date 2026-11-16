import { MetricConditionAggregate, type MetricConditionOperator, MetricEvaluationStatus, type MetricType, type MetricUnit } from '@tomato/constants';
import type { MetricSummaryView } from '@tomato/types';
import type { MetricResultSummarySource } from './metric-results.repository';

/** One summary per metric, in the order of `results`, with the worst value of its subjects */
export function summarizeMetrics(results: MetricResultSummarySource[]): MetricSummaryView[] {
  const byMetric = new Map<string, MetricResultSummarySource[]>();
  for (const result of results) byMetric.set(result.metric.id, [...(byMetric.get(result.metric.id) ?? []), result]);

  return [...byMetric.values()].map((ofMetric) => {
    const { type, unit } = ofMetric[0].metric;
    const evaluations = ofMetric.flatMap(({ evaluations: items }) => items);
    const gateStatus = evaluations.some(({ status }) => status === MetricEvaluationStatus.FAILED)
      ? MetricEvaluationStatus.FAILED
      : evaluations.length > 0
        ? MetricEvaluationStatus.PASSED
        : null;
    const first = evaluations.find(({ aggregate }) => aggregate === MetricConditionAggregate.NONE);

    return {
      type: type as MetricType,
      unit: unit as MetricUnit,
      worstValue: Math.max(...ofMetric.map(({ value }) => value)),
      gateStatus,
      limit: first ? { operator: first.operator as MetricConditionOperator, threshold: first.threshold } : null,
    };
  });
}
