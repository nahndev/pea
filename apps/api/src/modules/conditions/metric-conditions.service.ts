import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type AnalysisSchema,
  ErrorCode,
  MetricConditionAggregate,
  type MetricConditionOperator,
  MetricEvaluationStatus,
  type MetricType,
  type MetricUnit,
} from '@tomato/constants';
import type { MetricConditionView } from '@tomato/types';
import { type MetricResult, Prisma } from '../../generated/client';
import { MetricsService } from '../metrics/metrics.service';
import { CreateMetricConditionDto } from './dto/create-metric-condition.dto';
import { UpdateMetricConditionDto } from './dto/update-metric-condition.dto';
import { BASELINE_BY_AGGREGATE, VIOLATION_BY_OPERATOR } from './conditions.constants';
import type { MetricConditionWithRelations } from './conditions.types';
import { parseAggregateLimits } from './condition-aggregates';
import { MetricConditionsRepository } from './metric-conditions.repository';
import { MetricEvaluationsRepository, type MetricEvaluationSource } from './metric-evaluations.repository';

const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class MetricConditionsService {
  constructor(
    private readonly metricConditionsRepository: MetricConditionsRepository,
    private readonly metricEvaluationsRepository: MetricEvaluationsRepository,
    private readonly metricsService: MetricsService,
  ) {}

  async findAll(filter: { schema?: AnalysisSchema } = {}): Promise<MetricConditionView[]> {
    const conditions = await this.metricConditionsRepository.findAll(filter);
    return conditions.map((condition) => this.toView(condition));
  }

  async findOne(id: string): Promise<MetricConditionView> {
    const condition = await this.metricConditionsRepository.findById(id);
    if (!condition) throw new NotFoundException({ code: ErrorCode.METRIC_CONDITION_NOT_FOUND });
    return this.toView(condition);
  }

  async create({ aggregates = [], ...input }: CreateMetricConditionDto): Promise<MetricConditionView> {
    const metric = await this.metricsService.findOne(input.metricId);
    if (!metric) throw new NotFoundException({ code: ErrorCode.METRIC_NOT_FOUND });
    if (!metric.isActive) throw new BadRequestException({ code: ErrorCode.METRIC_DISABLED });
    if (await this.metricConditionsRepository.findByMetric(input.metricId)) {
      throw new ConflictException({ code: ErrorCode.METRIC_CONDITION_ALREADY_EXISTS });
    }

    try {
      return this.toView(await this.metricConditionsRepository.create({ ...input, aggregates }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.METRIC_CONDITION_ALREADY_EXISTS });
      }
      throw error;
    }
  }

  async update(
    id: string,
    { operator, threshold, aggregates, isActive }: UpdateMetricConditionDto,
  ): Promise<MetricConditionView> {
    const condition = await this.metricConditionsRepository.findById(id);
    if (!condition) throw new NotFoundException({ code: ErrorCode.METRIC_CONDITION_NOT_FOUND });
    if (operator === undefined && threshold === undefined && aggregates === undefined && isActive === undefined) {
      return this.toView(condition);
    }

    return this.toView(await this.metricConditionsRepository.update(id, { operator, threshold, aggregates, isActive }));
  }

  async evaluate(analysisResultId: string, analysisId: string, schema: AnalysisSchema): Promise<number> {
    const [conditions, results] = await Promise.all([
      this.metricConditionsRepository.findActiveBySchema(schema),
      this.metricsService.findResults(analysisResultId),
    ]);
    const resultsByMetric = new Map<string, MetricResult[]>();
    for (const result of results) {
      resultsByMetric.set(result.metricId, [...(resultsByMetric.get(result.metricId) ?? []), result]);
    }

    const items: MetricEvaluationSource[] = [];
    for (const { id, metricId, operator, threshold, aggregates } of conditions) {
      const metricResults = resultsByMetric.get(metricId) ?? [];
      if (!metricResults.length) continue;

      const limits = parseAggregateLimits(aggregates);
      const historyBySubject = limits.length
        ? await this.groupHistoryBySubject({ analysisId, excludeAnalysisResultId: analysisResultId, metricId, excludeConditionId: id })
        : undefined;

      for (const result of metricResults) {
        const plain = this.toEvaluation(result, id, MetricConditionAggregate.NONE, null, operator, threshold);
        if (plain) items.push(plain);

        const history = historyBySubject?.get(result.subjectUuid);
        if (!history) continue;
        for (const limit of limits) {
          const baseline = BASELINE_BY_AGGREGATE.get(limit.aggregate)?.(history);
          if (baseline === undefined) continue;
          const evaluation = this.toEvaluation(result, id, limit.aggregate, baseline, limit.operator, limit.threshold);
          if (evaluation) items.push(evaluation);
        }
      }
    }
    return this.metricEvaluationsRepository.createMany(items);
  }

  private toEvaluation(
    result: MetricResult,
    metricConditionId: string,
    aggregate: MetricConditionAggregate,
    baseline: number | null,
    operator: string,
    threshold: number,
  ): MetricEvaluationSource | null {
    const isViolated = VIOLATION_BY_OPERATOR.get(operator);
    if (!isViolated) return null;
    return {
      metricResultId: result.id,
      metricConditionId,
      status: isViolated(result.value - (baseline ?? 0), threshold) ? MetricEvaluationStatus.FAILED : MetricEvaluationStatus.PASSED,
      aggregate,
      baseline,
      operator,
      threshold,
    };
  }

  private async groupHistoryBySubject(
    filter: Parameters<MetricsService['findPassedHistory']>[0],
  ): Promise<Map<string | null, number[]>> {
    const history = await this.metricsService.findPassedHistory(filter);
    const valuesBySubject = new Map<string | null, number[]>();
    for (const { subjectUuid, value } of history) {
      valuesBySubject.set(subjectUuid, [...(valuesBySubject.get(subjectUuid) ?? []), value]);
    }
    return valuesBySubject;
  }

  private toView({ id, metric, operator, threshold, aggregates, isActive }: MetricConditionWithRelations): MetricConditionView {
    const { schema, ...rest } = metric;
    return {
      id,
      schema: schema as AnalysisSchema,
      metric: { ...rest, type: metric.type as MetricType, unit: metric.unit as MetricUnit },
      operator: operator as MetricConditionOperator,
      threshold,
      aggregates: parseAggregateLimits(aggregates),
      isActive,
    };
  }
}
