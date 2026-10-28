import { Injectable } from '@nestjs/common';
import type { AnalysisContextType } from '@tomato/constants';
import type { AnalysisContext } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalysisContextsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<AnalysisContext | null> {
    return this.prisma.analysisContext.findUnique({ where: { id } });
  }

  async findMany(
    where: { analysisId?: string; type?: AnalysisContextType },
    limit: number,
    offset: number,
  ): Promise<{ items: AnalysisContext[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.analysisContext.findMany({
        where,
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.analysisContext.count({ where }),
    ]);
    return { items, total };
  }
}
