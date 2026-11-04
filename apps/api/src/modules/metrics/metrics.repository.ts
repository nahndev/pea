import { Injectable } from '@nestjs/common';
import type { AnalysisSchema } from '@tomato/constants';
import type { Metric, Prisma } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MetricsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(filter: { isActive?: boolean; schema?: AnalysisSchema } = {}): Promise<Metric[]> {
    return this.prismaService.metric.findMany({ where: filter, orderBy: { id: 'asc' } });
  }

  async findTypesByAnalysisResult(analysisResultId: string): Promise<string[]> {
    const metrics = await this.prismaService.metric.findMany({
      where: { results: { some: { analysisResultId } } },
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });
    return metrics.map(({ type }) => type);
  }

  findById(id: string): Promise<Metric | null> {
    return this.prismaService.metric.findUnique({ where: { id } });
  }

  update(id: string, data: { description?: string; isActive?: boolean; config?: Prisma.InputJsonObject }): Promise<Metric> {
    return this.prismaService.metric.update({ where: { id }, data });
  }
}
