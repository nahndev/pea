import { Injectable, NotFoundException } from '@nestjs/common';
import { type AnalysisSchema, ErrorCode, type MetricConditionOperator, type MetricEvaluationStatus, type MetricType, type MetricUnit, type SubjectType } from '@tomato/constants';
import type { MetricResultView, MetricView, SubjectView } from '@tomato/types';
import type { Analysis, Metric, MetricResult, Subject } from '../../generated/client';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { MetricResultsRepository, type MetricResultSource } from './metric-results.repository';
import type { MetricSubject } from './metric-subject';
import { MetricsRepository } from './metrics.repository';
import { SubjectsRepository } from './subjects.repository';

@Injectable()
export class MetricsService {
  constructor(
    private readonly metricsRepository: MetricsRepository,
    private readonly metricResultsRepository: MetricResultsRepository,
    private readonly subjectsRepository: SubjectsRepository,
    private readonly metricHandlerFactory: MetricHandlerFactory,
  ) {}

  async measure(analysisResultId: string, analysis: Analysis): Promise<number> {
    const metrics = await this.metricsRepository.findAll({ isActive: true, schema: analysis.schema as AnalysisSchema });
    const items: MetricResultSource[] = [];
    const subjects = new Map<string, MetricSubject>();
    for (const metric of metrics) {
      if (!this.metricHandlerFactory.supports(metric.type)) continue;
      const measurements = await this.metricHandlerFactory.create(metric.type).handle(metric, analysis, analysisResultId);
      for (const { value, subject } of measurements) {
        if (subject) subjects.set(subject.uuid, subject);
        items.push({ metricId: metric.id, subjectUuid: subject?.uuid ?? null, value });
      }
    }
    await this.subjectsRepository.createMany([...subjects.values()]);
    return this.metricResultsRepository.createMany(analysisResultId, items);
  }

  async findAll(filter: { isActive?: boolean; schema?: AnalysisSchema } = {}): Promise<MetricView[]> {
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
      subject: subject && this.toSubjectView(subject),
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
      })),
    }));
  }

  private toSubjectView({ uuid, type, description }: Subject): SubjectView {
    return { uuid, type: type as SubjectType, description };
  }

  private toView({ id, schema, type, unit, description, isActive }: Metric): MetricView {
    return { id, schema: schema as AnalysisSchema, type: type as MetricType, unit: unit as MetricUnit, description, isActive };
  }
}
