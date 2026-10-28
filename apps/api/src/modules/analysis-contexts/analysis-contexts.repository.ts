import { Injectable } from '@nestjs/common';
import type { AnalysisContextType } from '@tomato/constants';
import type { AnalysisContext } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalysisContextsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findById(id: string): Promise<AnalysisContext | null> {
    return this.prismaService.analysisContext.findUnique({ where: { id } });
  }

  async findMany(
    where: { analysisId?: string; type?: AnalysisContextType },
    limit: number,
    offset: number,
  ): Promise<{ items: AnalysisContext[]; total: number }> {
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.analysisContext.findMany({
        where,
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.analysisContext.count({ where }),
    ]);
    return { items, total };
  }
}
