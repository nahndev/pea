import { Injectable } from '@nestjs/common';
import type { AnalysisSchema, MetricConditionOperator } from '@tomato/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { MetricConditionWithRelations } from './conditions.types';

const INCLUDE = {
  metric: { select: { id: true, schema: true, type: true, unit: true, description: true, isActive: true } },
} as const;

@Injectable()
export class MetricConditionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(filter: { schema?: AnalysisSchema } = {}): Promise<MetricConditionWithRelations[]> {
    return this.prismaService.metricCondition.findMany({
      where: filter.schema ? { metric: { schema: filter.schema } } : undefined,
      orderBy: [{ metric: { schema: 'asc' } }, { metric: { type: 'asc' } }, { id: 'asc' }],
      include: INCLUDE,
    });
  }

  findActiveBySchema(schema: AnalysisSchema): Promise<MetricConditionWithRelations[]> {
    return this.prismaService.metricCondition.findMany({
      where: { isActive: true, metric: { schema } },
      orderBy: { id: 'asc' },
      include: INCLUDE,
    });
  }

  findById(id: string): Promise<MetricConditionWithRelations | null> {
    return this.prismaService.metricCondition.findUnique({ where: { id }, include: INCLUDE });
  }

  findByMetric(metricId: string): Promise<MetricConditionWithRelations | null> {
    return this.prismaService.metricCondition.findUnique({ where: { metricId }, include: INCLUDE });
  }

  create(data: {
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
