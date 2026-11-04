import { Injectable, NotFoundException } from '@nestjs/common';
import { type AnalysisSchema, ErrorCode, type MetricConditionAggregate, type MetricConditionOperator, type MetricEvaluationStatus, type MetricType, type MetricUnit } from '@tomato/constants';
import type { MetricEvaluationView, MetricHistoryItemView, MetricResultFilterOptions, MetricResultView, MetricSummaryView, MetricView, Paginated, SubjectView } from '@tomato/types';
import type { Metric, MetricEvaluation, MetricResult } from '../../generated/client';
import type { AnalysisContext } from '../analyses/analyses.types';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { filterBySubject, mergeMetricConfig, parseMetricConfig } from './metric-config';
import { MetricResultsRepository, type MetricResultSource } from './metric-results.repository';
import { type SubjectSource, toSubjectView } from '../subjects/subject';
import { SubjectsService } from '../subjects/subjects.service';
import { SUMMARY_METRIC_TYPES } from './metrics.constants';
import { MetricsRepository } from './metrics.repository';
import { summarizeMetrics } from './summarize-metrics';

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

  async findResultPage(
    analysisResultId: string,
    filters: { metricType?: MetricType; subjectUuid?: string },
    limit: number,
    offset: number,
  ): Promise<Paginated<MetricResultView>> {
    const { items, total } = await this.metricResultsRepository.findDetailedPage(analysisResultId, filters, limit, offset);
    return {
      total,
      items: items.map(({ id, value, subject, metric, evaluations }) => ({
        id,
        value,
        subject: subject && toSubjectView(subject),
        metric: { id: metric.id, type: metric.type as MetricType, unit: metric.unit as MetricUnit, description: metric.description },
        evaluations: evaluations.map((evaluation) => this.toEvaluationView(evaluation)),
      })),
    };
  }

  async findResultFilterOptions(analysisResultId: string): Promise<MetricResultFilterOptions> {
    const [metricTypes, subjects] = await Promise.all([
      this.metricsRepository.findTypesByAnalysisResult(analysisResultId),
      this.subjectsService.findByAnalysisResult(analysisResultId),
    ]);
    return { metricTypes: metricTypes as MetricType[], subjects };
  }

  async findSummaries(analysisResultId: string): Promise<MetricSummaryView[]> {
    const results = await this.metricResultsRepository.findSummarySources(analysisResultId, SUMMARY_METRIC_TYPES);
    return summarizeMetrics(SUMMARY_METRIC_TYPES, results);
  }

  async findHistory(metricId: string, limit: number, offset: number): Promise<Paginated<MetricHistoryItemView>> {
    await this.getById(metricId);
    const { items, total } = await this.metricResultsRepository.findHistoryByMetric(metricId, limit, offset);
    return {
      total,
      items: items.map(({ id, value, createdAt, subject, evaluations, analysisResult: { analysis } }) => ({
        id,
        value,
        createdAt: createdAt.toISOString(),
        subject: subject && toSubjectView(subject),
        analysis: { id: analysis.id, title: analysis.title, branch: { id: analysis.branch.id, name: analysis.branch.name } },
        evaluations: evaluations.map((evaluation) => this.toEvaluationView(evaluation)),
      })),
    };
  }

  private toEvaluationView({ status, aggregate, baseline, operator, threshold }: MetricEvaluation): MetricEvaluationView {
    return {
      status: status as MetricEvaluationStatus,
      aggregate: aggregate as MetricConditionAggregate,
      baseline,
      operator: operator as MetricConditionOperator,
      threshold,
    };
  }

  private toView({ id, schema, type, unit, description, isActive, config }: Metric): MetricView {
    const { include, exclude } = parseMetricConfig(config);
    return { id, schema: schema as AnalysisSchema, type: type as MetricType, unit: unit as MetricUnit, description, isActive, include, exclude };
  }
}
