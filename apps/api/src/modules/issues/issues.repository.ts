import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

export type IssueWithRelations = Prisma.IssueGetPayload<{ include: { rule: true; analysisContext: true } }>;

export interface IssueSource {
  ruleId: string;
  analysisContextId: string;
  description?: string;
}

@Injectable()
export class IssuesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(analysisResultId: string, items: IssueSource[]): Promise<number> {
    const { count } = await this.prismaService.issue.createMany({
      data: items.map((item) => ({ ...item, analysisResultId })),
    });
    return count;
  }

  async findPage(
    analysisResultId: string,
    filters: { status?: string; ruleType?: string },
    limit: number,
    offset: number,
  ): Promise<{ items: IssueWithRelations[]; total: number }> {
    const where: Prisma.IssueWhereInput = {
      analysisResultId,
      status: filters.status,
      rule: filters.ruleType ? { type: filters.ruleType } : undefined,
    };
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.issue.findMany({
        where,
        include: { rule: true, analysisContext: true },
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.issue.count({ where }),
    ]);
    return { items, total };
  }
}
