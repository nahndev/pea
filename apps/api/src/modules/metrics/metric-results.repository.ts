import { Injectable } from '@nestjs/common';
import {
  AnalysisResultStatus,
  MetricEvaluationStatus,
  type MetricHistorySortField,
  type MetricResultSortField,
  type SortOrder,
} from '@tomato/constants';
import type { MetricResult, Prisma } from '../../generated/client';
import { type Ordering, toPrismaOrderBy } from '../../common/sort/sort';
import { PrismaService } from '../../prisma/prisma.service';

export type MetricResultWithDetails = Prisma.MetricResultGetPayload<{
  include: { metric: true; subject: true; evaluations: true };
}>;

const HISTORY_INCLUDE = {
  subject: true,
  evaluations: { orderBy: { id: 'asc' } },
  analysisResult: { include: { analysis: { include: { branch: true } } } },
} satisfies Prisma.MetricResultInclude;

export type MetricResultHistory = Prisma.MetricResultGetPayload<{ include: typeof HISTORY_INCLUDE }>;

const SUMMARY_SELECT = {
  value: true,
  metric: { select: { type: true } },
  evaluations: { select: { status: true, aggregate: true, operator: true, threshold: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.MetricResultSelect;

export type MetricResultSummarySource = Prisma.MetricResultGetPayload<{ select: typeof SUMMARY_SELECT }>;

type MetricResultOrderBy = Prisma.MetricResultOrderByWithRelationInput;

const RESULT_ORDER_BY: Record<MetricResultSortField, (order: SortOrder) => MetricResultOrderBy> = {
  metric: (order) => ({ metric: { type: order } }),
  subject: (order) => ({ subject: { description: order } }),
  value: (order) => ({ value: order }),
  unit: (order) => ({ metric: { unit: order } }),
};

const HISTORY_ORDER_BY: Record<MetricHistorySortField, (order: SortOrder) => MetricResultOrderBy> = {
  analysis: (order) => ({ analysisResult: { analysis: { title: order } } }),
  branch: (order) => ({ analysisResult: { analysis: { branch: { name: order } } } }),
  subject: (order) => ({ subject: { description: order } }),
  value: (order) => ({ value: order }),
  createdAt: (order) => ({ createdAt: order }),
};

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

  async findHistoryByMetric(
    metricId: string,
    limit: number,
    offset: number,
    ordering: Ordering<MetricHistorySortField> = [],
  ): Promise<{ items: MetricResultHistory[]; total: number }> {
    const where: Prisma.MetricResultWhereInput = { metricId };
    const defaultOrderBy: MetricResultOrderBy[] = [{ createdAt: 'desc' }, { id: 'desc' }];
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.metricResult.findMany({
        where,
        include: HISTORY_INCLUDE,
        orderBy: [...toPrismaOrderBy(ordering, HISTORY_ORDER_BY), ...defaultOrderBy],
        take: limit,
        skip: offset,
      }),
      this.prismaService.metricResult.count({ where }),
    ]);
    return { items, total };
  }

  async findDetailedPage(
    analysisResultId: string,
    filters: { metricType?: string; subjectUuid?: string },
    limit: number,
    offset: number,
    ordering: Ordering<MetricResultSortField> = [],
  ): Promise<{ items: MetricResultWithDetails[]; total: number }> {
    const where: Prisma.MetricResultWhereInput = {
      analysisResultId,
      metric: filters.metricType ? { type: filters.metricType } : undefined,
      subjectUuid: filters.subjectUuid,
    };
    const defaultOrderBy: MetricResultOrderBy[] = [{ metric: { type: 'asc' } }, { subject: { description: 'asc' } }, { id: 'asc' }];
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.metricResult.findMany({
        where,
        orderBy: [...toPrismaOrderBy(ordering, RESULT_ORDER_BY), ...defaultOrderBy],
        include: { metric: true, subject: true, evaluations: { orderBy: { id: 'asc' } } },
        take: limit,
        skip: offset,
      }),
      this.prismaService.metricResult.count({ where }),
    ]);
    return { items, total };
  }

  findSummarySources(analysisResultId: string, types: readonly string[]): Promise<MetricResultSummarySource[]> {
    return this.prismaService.metricResult.findMany({
      where: { analysisResultId, metric: { type: { in: [...types] } } },
      select: SUMMARY_SELECT,
    });
  }
}
