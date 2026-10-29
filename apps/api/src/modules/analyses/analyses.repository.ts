import { Injectable } from '@nestjs/common';
import type { Analysis, Prisma } from '../../generated/client';
import type { StoredFile } from '../files/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_TREND_METRIC_TYPES } from './analyses.constants';
import {
  LATEST_RESULT_INCLUDE,
  LATEST_RESULT_ORDER_BY,
  type AnalysisDetailRecord,
  type AnalysisTrendRecord,
  type MetricTrendPick,
  type AnalysisWithLatestResult,
} from './analyses.types';

interface CreateAnalysisData {
  branchId: string;
  mergeRequestIid?: number;
  file: StoredFile;
}

@Injectable()
export class AnalysesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ branchId, mergeRequestIid, file }: CreateAnalysisData): Promise<Analysis> {
    return this.prismaService.analysis.create({ data: { branchId, mergeRequestIid, ...file } });
  }

  findById(id: string): Promise<Analysis | null> {
    return this.prismaService.analysis.findUnique({ where: { id } });
  }

  findDetailById(id: string): Promise<AnalysisDetailRecord | null> {
    return this.prismaService.analysis.findUnique({
      where: { id },
      include: { ...LATEST_RESULT_INCLUDE, branch: true },
    });
  }

  async findPageByBranch(
    branchId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: AnalysisWithLatestResult[]; total: number }> {
    const where = { branchId };
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.analysis.findMany({
        where,
        include: LATEST_RESULT_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prismaService.analysis.count({ where }),
    ]);
    return { items, total };
  }

  findRecentByBranch(branchId: string, limit: number, picks: MetricTrendPick[]): Promise<AnalysisTrendRecord[]> {
    const where: Prisma.MetricResultWhereInput = picks.length
      ? { OR: picks }
      : { subject: '', metric: { type: { in: [...DEFAULT_TREND_METRIC_TYPES] } } };
    return this.prismaService.analysis.findMany({
      where: { branchId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        createdAt: true,
        mergeRequestIid: true,
        results: {
          orderBy: LATEST_RESULT_ORDER_BY,
          take: 1,
          select: {
            metricResults: {
              where,
              select: { value: true, subject: true, metric: { select: { id: true, type: true, unit: true, description: true } } },
            },
          },
        },
      },
    });
  }
}
