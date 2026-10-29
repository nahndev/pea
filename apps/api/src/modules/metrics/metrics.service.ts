import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode, type MetricConditionOperator, type MetricEvaluationStatus, type MetricType, type MetricUnit } from '@tomato/constants';
import type { MetricResultView, MetricView } from '@tomato/types';
import type { Analysis, Metric, MetricResult } from '../../generated/client';
import { UpdateMetricDto } from './dto/update-metric.dto';
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

  async measure(analysisResultId: string, analysis: Analysis): Promise<number> {
    const metrics = await this.metricsRepository.findAll({ isActive: true });
    const items: MetricResultSource[] = [];
    for (const metric of metrics) {
      if (!this.metricHandlerFactory.supports(metric.type)) continue;
      const measurements = await this.metricHandlerFactory.create(metric.type).handle(metric, analysis, analysisResultId);
      for (const { value, subject = '' } of measurements) {
        items.push({ metricId: metric.id, subject, value });
      }
    }
    return this.metricResultsRepository.createMany(analysisResultId, items);
  }

  async findAll(filter: { isActive?: boolean } = {}): Promise<MetricView[]> {
    const metrics = await this.metricsRepository.findAll(filter);
    return metrics.map((metric) => this.toView(metric));
  }

  async getById(id: string): Promise<MetricView> {
    const metric = await this.findOne(id);
    if (!metric) throw new NotFoundException({ code: ErrorCode.METRIC_NOT_FOUND });
    return metric;
  }

  async update(id: string, { description, isActive }: UpdateMetricDto): Promise<MetricView> {
    const metric = await this.getById(id);
    if (description === undefined && isActive === undefined) return metric;

    return this.toView(await this.metricsRepository.update(id, { description, isActive }));
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
    return results.map(({ id, value, subject, metric, evaluations }) => ({
      id,
      value,
      subject,
      metric: {
        id: metric.id,
        type: metric.type as MetricType,
        unit: metric.unit as MetricUnit,
        description: metric.description,
      },
      evaluations: evaluations.map((evaluation) => ({
        status: evaluation.status as MetricEvaluationStatus,
        operator: evaluation.operator as MetricConditionOperator,
        threshold: evaluation.threshold,
        qualityGate: evaluation.metricCondition.qualityGate.name,
      })),
    }));
  }

  private toView({ id, type, unit, description, isActive }: Metric): MetricView {
    return { id, type: type as MetricType, unit: unit as MetricUnit, description, isActive };
  }
}
