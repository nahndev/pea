import { Injectable } from '@nestjs/common';
import type { MetricConditionOperator, MetricEvaluationStatus, MetricType } from '@tomato/constants';
import type { MetricResultView } from '@tomato/types';
import type { AnalysisContext, MetricResult } from '../../generated/client';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { MetricResultsRepository, type MetricResultSource } from './metric-results.repository';
import { MetricsRepository } from './metrics.repository';

@Injectable()
export class MetricsService {
  constructor(
    private readonly metricsRepository: MetricsRepository,
    private readonly metricResultsRepository: MetricResultsRepository,
    private readonly metricHandlerFactory: MetricHandlerFactory,
  ) {}

  async measure(analysisResultId: string, contexts: AnalysisContext[]): Promise<number> {
    const metrics = await this.metricsRepository.findAll();
    const items: MetricResultSource[] = [];
    for (const context of contexts) {
      for (const metric of metrics) {
        if (!this.metricHandlerFactory.supports(metric.type)) continue;
        const value = await this.metricHandlerFactory.create(metric.type).handle(metric, context, analysisResultId);
        if (value !== null) items.push({ metricId: metric.id, analysisContextId: context.id, value });
      }
    }
    return this.metricResultsRepository.createMany(analysisResultId, items);
  }

  findResults(analysisResultId: string): Promise<MetricResult[]> {
    return this.metricResultsRepository.findByAnalysisResult(analysisResultId);
  }

  async findResultViews(analysisResultId: string): Promise<MetricResultView[]> {
    const results = await this.metricResultsRepository.findDetailedByAnalysisResult(analysisResultId);
    return results.map(({ id, value, metric, analysisContext, evaluations }) => ({
      id,
      value,
      metric: { type: metric.type as MetricType, description: metric.description },
      context: { file: analysisContext.file },
      evaluations: evaluations.map((evaluation) => ({
        status: evaluation.status as MetricEvaluationStatus,
        operator: evaluation.operator as MetricConditionOperator,
        threshold: evaluation.threshold,
        qualityGate: evaluation.metricCondition.qualityGate.name,
      })),
    }));
  }
}
