import { Injectable } from '@nestjs/common';
import type { AnalysisResultStatus } from '@tomato/constants';
import type { AnalysisResult } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalysisRunnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(analysisId: string): Promise<AnalysisResult> {
    return this.prisma.analysisResult.create({ data: { analysisId } });
  }

  finish(
    id: string,
    data: { status: AnalysisResultStatus; issueCount: number },
  ): Promise<AnalysisResult> {
    return this.prisma.analysisResult.update({ where: { id }, data });
  }

  findById(id: string): Promise<AnalysisResult | null> {
    return this.prisma.analysisResult.findUnique({ where: { id } });
  }

  async findMany(
    analysisId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: AnalysisResult[]; total: number }> {
    const where = { analysisId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.analysisResult.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prisma.analysisResult.count({ where }),
    ]);
    return { items, total };
  }
}
