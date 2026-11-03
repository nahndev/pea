import { Injectable, NotFoundException } from '@nestjs/common';
import { type AnalysisSchema, ErrorCode, type MetricConditionAggregate, type MetricConditionOperator, type MetricEvaluationStatus, type MetricType, type MetricUnit } from '@tomato/constants';
import type { MetricResultView, MetricView, SubjectView } from '@tomato/types';
import type { Metric, MetricResult } from '../../generated/client';
import type { AnalysisContext } from '../analyses/analyses.types';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { filterBySubject, mergeMetricConfig, parseMetricConfig } from './metric-config';
import { MetricResultsRepository, type MetricResultSource } from './metric-results.repository';
import { type SubjectSource, toSubjectView } from '../subjects/subject';
import { SubjectsService } from '../subjects/subjects.service';
import { MetricsRepository } from './metrics.repository';

@Injectable()
export class MetricsService {
  constructor(
    private readonly metricsRepository: MetricsRepository,
    private readonly metricResultsRepository: MetricResultsRepository,
    private readonly subjectsService: SubjectsService,
    private readonly metricHandlerFactory: MetricHandlerFactory,
  ) {}

  async measure(analysisResultId: string, context: AnalysisContext): Promise<number> {
    const metrics = await this.metricsRepository.findAll({ isActive: true, schema: context.schema });
    const items: MetricResultSource[] = [];
    const subjects: SubjectSource[] = [];
    for (const metric of metrics) {
      if (!this.metricHandlerFactory.supports(metric.type)) continue;
      const handled = await this.metricHandlerFactory.create(metric.type).handle(metric, context, analysisResultId);
      const measurements = filterBySubject(handled, parseMetricConfig(metric.config));
      for (const { value, subject } of measurements) {
        if (subject) subjects.push(subject);
        items.push({ metricId: metric.id, subjectUuid: subject?.uuid ?? null, value });
      }
    }
    await this.subjectsService.createMany(subjects);
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

  async update(id: string, { description, isActive, include, exclude }: UpdateMetricDto): Promise<MetricView> {
    const metric = await this.metricsRepository.findById(id);
    if (!metric) throw new NotFoundException({ code: ErrorCode.METRIC_NOT_FOUND });
    if ([description, isActive, include, exclude].every((value) => value === undefined)) return this.toView(metric);

    const isConfigChanged = include !== undefined || exclude !== undefined;
    const config = isConfigChanged ? mergeMetricConfig(metric.config, { include, exclude }) : undefined;
    return this.toView(await this.metricsRepository.update(id, { description, isActive, config }));
  }

  async findSubjects(metricId: string): Promise<SubjectView[]> {
    await this.getById(metricId);
    return this.subjectsService.findByMetric(metricId);
  }

  async findOne(id: string): Promise<MetricView | null> {
    const metric = await this.metricsRepository.findById(id);
    return metric ? this.toView(metric) : null;
  }

  findResults(analysisResultId: string): Promise<MetricResult[]> {
    return this.metricResultsRepository.findByAnalysisResult(analysisResultId);
  }

  findPassedHistory(
    filter: Parameters<MetricResultsRepository['findPassedHistory']>[0],
  ): ReturnType<MetricResultsRepository['findPassedHistory']> {
    return this.metricResultsRepository.findPassedHistory(filter);
  }

  async findResultViews(analysisResultId: string): Promise<MetricResultView[]> {
    const results = await this.metricResultsRepository.findDetailedByAnalysisResult(analysisResultId);
    return results.map(({ id, value, subject, metric, evaluations }) => ({
      id,
      value,
      subject: subject && toSubjectView(subject),
      metric: {
        id: metric.id,
        type: metric.type as MetricType,
        unit: metric.unit as MetricUnit,
        description: metric.description,
      },
      evaluations: evaluations.map((evaluation) => ({
        status: evaluation.status as MetricEvaluationStatus,
        aggregate: evaluation.aggregate as MetricConditionAggregate,
        baseline: evaluation.baseline,
        operator: evaluation.operator as MetricConditionOperator,
        threshold: evaluation.threshold,
      })),
    }));
  }

  private toView({ id, schema, type, unit, description, isActive, config }: Metric): MetricView {
    const { include, exclude } = parseMetricConfig(config);
    return { id, schema: schema as AnalysisSchema, type: type as MetricType, unit: unit as MetricUnit, description, isActive, include, exclude };
  }
}
