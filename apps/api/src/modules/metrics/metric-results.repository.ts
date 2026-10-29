import { Injectable } from '@nestjs/common';
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
