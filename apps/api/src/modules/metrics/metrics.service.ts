import { Injectable } from '@nestjs/common';
import type { MetricConditionOperator, MetricEvaluationStatus, MetricType, MetricUnit } from '@tomato/constants';
import type { MetricResultView, MetricView } from '@tomato/types';
import type { AnalysisContext, Metric, MetricResult } from '../../generated/client';
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
        const measurements = await this.metricHandlerFactory
          .create(metric.type)
          .handle(metric, context, analysisResultId);
        for (const { value, subject = '' } of measurements) {
          items.push({ metricId: metric.id, analysisContextId: context.id, subject, value });
        }
      }
    }
    return this.metricResultsRepository.createMany(analysisResultId, items);
  }

  async findAll(): Promise<MetricView[]> {
    const metrics = await this.metricsRepository.findAll();
    return metrics.map((metric) => this.toView(metric));
  }

  async findOne(id: string): Promise<MetricView | null> {
    const metric = await this.metricsRepository.findById(id);
    return metric ? this.toView(metric) : null;
  }

  findResults(analysisResultId: string): Promise<MetricResult[]> {
    return this.metricResultsRepository.findByAnalysisResult(analysisResultId);
  }

  async findResultViews(analysisResultId: string): Promise<MetricResultView[]> {
    const results = await this.metricResultsRepository.findDetailedByAnalysisResult(analysisResultId);
    return results.map(({ id, value, subject, metric, analysisContext, evaluations }) => ({
      id,
      value,
      subject,
      metric: {
        id: metric.id,
        type: metric.type as MetricType,
        unit: metric.unit as MetricUnit,
        description: metric.description,
      },
      context: { file: analysisContext.file },
      evaluations: evaluations.map((evaluation) => ({
        status: evaluation.status as MetricEvaluationStatus,
        operator: evaluation.operator as MetricConditionOperator,
        threshold: evaluation.threshold,
        qualityGate: evaluation.metricCondition.qualityGate.name,
      })),
    }));
  }

  private toView({ id, type, unit, description }: Metric): MetricView {
    return { id, type: type as MetricType, unit: unit as MetricUnit, description };
  }
}
