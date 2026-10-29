import { Injectable } from '@nestjs/common';
import { MetricEvaluationStatus } from '@tomato/constants';
import type { QualityGateView } from '@tomato/types';
import type { MetricResult } from '../../generated/client';
import { MetricsService } from '../metrics/metrics.service';
import { MetricEvaluationsRepository, type MetricEvaluationSource } from './metric-evaluations.repository';
import { VIOLATION_BY_OPERATOR } from './quality-gates.constants';
import { QualityGatesRepository } from './quality-gates.repository';

@Injectable()
export class QualityGatesService {
  constructor(
    private readonly qualityGatesRepository: QualityGatesRepository,
    private readonly metricEvaluationsRepository: MetricEvaluationsRepository,
    private readonly metricsService: MetricsService,
  ) {}

  async findAll(): Promise<QualityGateView[]> {
    const gates = await this.qualityGatesRepository.findAll();
    return gates.map(({ id, name, description }) => ({ id, name, description }));
  }

  async evaluate(analysisResultId: string): Promise<number> {
    const [gates, results] = await Promise.all([
      this.qualityGatesRepository.findAllWithConditions(),
      this.metricsService.findResults(analysisResultId),
    ]);
    const resultsByMetric = new Map<string, MetricResult[]>();
    for (const result of results) {
      resultsByMetric.set(result.metricId, [...(resultsByMetric.get(result.metricId) ?? []), result]);
    }

    const items: MetricEvaluationSource[] = [];
    for (const { conditions } of gates) {
      for (const { id, metricId, operator, threshold, isActive } of conditions) {
        if (!isActive) continue;
        const isViolated = VIOLATION_BY_OPERATOR.get(operator);
        if (!isViolated) continue;
        for (const result of resultsByMetric.get(metricId) ?? []) {
          items.push({
            metricResultId: result.id,
            metricConditionId: id,
            status: isViolated(result.value, threshold) ? MetricEvaluationStatus.FAILED : MetricEvaluationStatus.PASSED,
            operator,
            threshold,
          });
        }
      }
    }
    return this.metricEvaluationsRepository.createMany(items);
  }
}
