import { Injectable } from '@nestjs/common';
import type { AnalysisResultStatus } from '@tomato/constants';
import type { AnalysisResult } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalysisRunnerRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(analysisId: string): Promise<AnalysisResult> {
    return this.prismaService.analysisResult.create({ data: { analysisId } });
  }

  finish(
    id: string,
    data: { status: AnalysisResultStatus; issueCount: number },
  ): Promise<AnalysisResult> {
    return this.prismaService.analysisResult.update({ where: { id }, data });
  }

  findById(id: string): Promise<AnalysisResult | null> {
    return this.prismaService.analysisResult.findUnique({ where: { id } });
  }

  findLatest(analysisId: string): Promise<AnalysisResult | null> {
    return this.prismaService.analysisResult.findFirst({
      where: { analysisId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async findMany(
    analysisId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: AnalysisResult[]; total: number }> {
    const where = { analysisId };
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.analysisResult.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prismaService.analysisResult.count({ where }),
    ]);
    return { items, total };
  }
}
