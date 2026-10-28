import { Injectable } from '@nestjs/common';
import type { MetricEvaluationStatus } from '@tomato/constants';
import { PrismaService } from '../../prisma/prisma.service';

export interface MetricEvaluationSource {
  metricResultId: string;
  metricConditionId: string;
  status: MetricEvaluationStatus;
  operator: string;
  threshold: number;
}

@Injectable()
export class MetricEvaluationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(items: MetricEvaluationSource[]): Promise<number> {
    const { count } = await this.prismaService.metricEvaluation.createMany({ data: items });
    return count;
  }
}
