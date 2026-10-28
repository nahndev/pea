import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LATEST_RESULT_INCLUDE,
  LATEST_RESULT_ORDER_BY,
  type AnalysisContextFile,
  type AnalysisDetailRecord,
  type AnalysisTrendRecord,
  type AnalysisWithContexts,
  type AnalysisWithLatestResult,
} from './analyses.types';

interface CreateAnalysisData {
  branchId: string;
  mergeRequestIid?: number;
  files: AnalysisContextFile[];
}

@Injectable()
export class AnalysesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ branchId, mergeRequestIid, files }: CreateAnalysisData): Promise<AnalysisWithContexts> {
    return this.prismaService.analysis.create({
      data: {
        branchId,
        mergeRequestIid,
        contexts: { create: files },
      },
      include: { contexts: true },
    });
  }

  findById(id: string): Promise<AnalysisWithContexts | null> {
    return this.prismaService.analysis.findUnique({ where: { id }, include: { contexts: true } });
  }

  findDetailById(id: string): Promise<AnalysisDetailRecord | null> {
    return this.prismaService.analysis.findUnique({
      where: { id },
      include: { ...LATEST_RESULT_INCLUDE, branch: true, contexts: { orderBy: { id: 'asc' } } },
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

  findRecentByBranch(branchId: string, limit: number): Promise<AnalysisTrendRecord[]> {
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
          select: { metricResults: { select: { value: true, metric: { select: { type: true } } } } },
        },
      },
    });
  }
}
