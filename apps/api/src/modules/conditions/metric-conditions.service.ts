import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type AnalysisSchema,
  ErrorCode,
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
import { VIOLATION_BY_OPERATOR } from './conditions.constants';
import type { MetricConditionWithRelations } from './conditions.types';
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

  async findAll(): Promise<MetricConditionView[]> {
    const conditions = await this.metricConditionsRepository.findAll();
    return conditions.map((condition) => this.toView(condition));
  }

  async findOne(id: string): Promise<MetricConditionView> {
    const condition = await this.metricConditionsRepository.findById(id);
    if (!condition) throw new NotFoundException({ code: ErrorCode.METRIC_CONDITION_NOT_FOUND });
    return this.toView(condition);
  }

  async create(input: CreateMetricConditionDto): Promise<MetricConditionView> {
    const metric = await this.metricsService.findOne(input.metricId);
    if (!metric) throw new NotFoundException({ code: ErrorCode.METRIC_NOT_FOUND });
    if (!metric.isActive) throw new BadRequestException({ code: ErrorCode.METRIC_DISABLED });
    if (await this.metricConditionsRepository.findByMetric(input.metricId)) {
      throw new ConflictException({ code: ErrorCode.METRIC_CONDITION_ALREADY_EXISTS });
    }

    try {
      return this.toView(await this.metricConditionsRepository.create(input));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.METRIC_CONDITION_ALREADY_EXISTS });
      }
      throw error;
    }
  }

  async update(id: string, { operator, threshold, isActive }: UpdateMetricConditionDto): Promise<MetricConditionView> {
    const condition = await this.metricConditionsRepository.findById(id);
    if (!condition) throw new NotFoundException({ code: ErrorCode.METRIC_CONDITION_NOT_FOUND });
    if (operator === undefined && threshold === undefined && isActive === undefined) return this.toView(condition);

    return this.toView(await this.metricConditionsRepository.update(id, { operator, threshold, isActive }));
  }

  async evaluate(analysisResultId: string, schema: AnalysisSchema): Promise<number> {
    const [conditions, results] = await Promise.all([
      this.metricConditionsRepository.findActiveBySchema(schema),
      this.metricsService.findResults(analysisResultId),
    ]);
    const resultsByMetric = new Map<string, MetricResult[]>();
    for (const result of results) {
      resultsByMetric.set(result.metricId, [...(resultsByMetric.get(result.metricId) ?? []), result]);
    }

    const items: MetricEvaluationSource[] = [];
    for (const { id, metricId, operator, threshold } of conditions) {
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
    return this.metricEvaluationsRepository.createMany(items);
  }

  private toView({ id, metric, operator, threshold, isActive }: MetricConditionWithRelations): MetricConditionView {
    const { schema, ...rest } = metric;
    return {
      id,
      schema: schema as AnalysisSchema,
      metric: { ...rest, type: metric.type as MetricType, unit: metric.unit as MetricUnit },
      operator: operator as MetricConditionOperator,
      threshold,
      isActive,
    };
  }
}
