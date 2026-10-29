import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode, type MetricConditionOperator, type MetricType, type MetricUnit } from '@tomato/constants';
import type { MetricConditionView } from '@tomato/types';
import { Prisma } from '../../generated/client';
import { MetricsService } from '../metrics/metrics.service';
import { CreateMetricConditionDto } from './dto/create-metric-condition.dto';
import { UpdateMetricConditionDto } from './dto/update-metric-condition.dto';
import { MetricConditionsRepository } from './metric-conditions.repository';
import { QualityGatesRepository } from './quality-gates.repository';
import type { MetricConditionWithRelations } from './quality-gates.types';

const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class MetricConditionsService {
  constructor(
    private readonly metricConditionsRepository: MetricConditionsRepository,
    private readonly qualityGatesRepository: QualityGatesRepository,
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
    if (!(await this.qualityGatesRepository.findById(input.qualityGateId))) {
      throw new NotFoundException({ code: ErrorCode.QUALITY_GATE_NOT_FOUND });
    }
    if (!(await this.metricsService.findOne(input.metricId))) {
      throw new NotFoundException({ code: ErrorCode.METRIC_NOT_FOUND });
    }
    if (await this.metricConditionsRepository.findByGateAndMetric(input.qualityGateId, input.metricId)) {
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

  private toView({ id, qualityGate, metric, operator, threshold, isActive }: MetricConditionWithRelations): MetricConditionView {
    return {
      id,
      qualityGate,
      metric: { ...metric, type: metric.type as MetricType, unit: metric.unit as MetricUnit },
      operator: operator as MetricConditionOperator,
      threshold,
      isActive,
    };
  }
}
