import { Injectable } from '@nestjs/common';
import { AnalysisResultStatus, MetricEvaluationStatus } from '@tomato/constants';
import type { MetricResult, Prisma } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

export type MetricResultWithDetails = Prisma.MetricResultGetPayload<{
  include: { metric: true; subject: true; evaluations: true };
}>;

export interface MetricResultSource {
  metricId: string;
  subjectUuid: string | null;
  value: number;
}

@Injectable()
export class MetricResultsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(analysisResultId: string, items: MetricResultSource[]): Promise<number> {
    const { count } = await this.prismaService.metricResult.createMany({
      data: items.map((item) => ({ ...item, analysisResultId })),
    });
    return count;
  }

  findByAnalysisResult(analysisResultId: string): Promise<MetricResult[]> {
    return this.prismaService.metricResult.findMany({ where: { analysisResultId }, orderBy: { id: 'asc' } });
  }

  findPassedHistory(filter: {
    analysisId: string;
    excludeAnalysisResultId: string;
    metricId: string;
    excludeConditionId: string;
  }): Promise<Pick<MetricResult, 'subjectUuid' | 'value'>[]> {
    return this.prismaService.metricResult.findMany({
      where: {
        metricId: filter.metricId,
        analysisResult: {
          analysisId: filter.analysisId,
          id: { not: filter.excludeAnalysisResultId },
          status: AnalysisResultStatus.COMPLETED,
        },
        evaluations: {
          none: { status: MetricEvaluationStatus.FAILED, metricConditionId: { not: filter.excludeConditionId } },
        },
      },
      select: { subjectUuid: true, value: true },
    });
  }

  findDetailedByAnalysisResult(analysisResultId: string): Promise<MetricResultWithDetails[]> {
    return this.prismaService.metricResult.findMany({
      where: { analysisResultId },
      orderBy: [{ metric: { type: 'asc' } }, { subject: { description: 'asc' } }],
      include: {
        metric: true,
        subject: true,
        evaluations: { orderBy: { id: 'asc' } },
      },
    });
  }
}
