import { Injectable } from '@nestjs/common';
import type { MetricConditionOperator } from '@tomato/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { MetricConditionWithRelations } from './quality-gates.types';

const INCLUDE = {
  qualityGate: { select: { id: true, name: true } },
  metric: { select: { id: true, type: true, unit: true, description: true } },
} as const;

@Injectable()
export class MetricConditionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<MetricConditionWithRelations[]> {
    return this.prismaService.metricCondition.findMany({
      orderBy: [{ qualityGate: { name: 'asc' } }, { id: 'asc' }],
      include: INCLUDE,
    });
  }

  findById(id: string): Promise<MetricConditionWithRelations | null> {
    return this.prismaService.metricCondition.findUnique({ where: { id }, include: INCLUDE });
  }

  findByGateAndMetric(qualityGateId: string, metricId: string): Promise<MetricConditionWithRelations | null> {
    return this.prismaService.metricCondition.findUnique({
      where: { qualityGateId_metricId: { qualityGateId, metricId } },
      include: INCLUDE,
    });
  }

  create(data: {
    qualityGateId: string;
    metricId: string;
    operator: MetricConditionOperator;
    threshold: number;
  }): Promise<MetricConditionWithRelations> {
    return this.prismaService.metricCondition.create({ data, include: INCLUDE });
  }

  update(
    id: string,
    data: { operator?: MetricConditionOperator; threshold?: number; isActive?: boolean },
  ): Promise<MetricConditionWithRelations> {
    return this.prismaService.metricCondition.update({ where: { id }, data, include: INCLUDE });
  }
}
