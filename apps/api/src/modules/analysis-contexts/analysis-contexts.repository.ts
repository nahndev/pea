import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalysisContext } from './entities/analysis-context.entity';

@Injectable()
export class AnalysisContextsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<AnalysisContext | null> {
    return this.prisma.analysisContext.findUnique({ where: { id } });
  }

  async findMany(
    analysisId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: AnalysisContext[]; total: number }> {
    const where = { analysisId };
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
