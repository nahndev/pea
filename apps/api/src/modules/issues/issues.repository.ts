import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IssueSubjectKey } from './issue-subjects.repository';

export type IssueWithRelations = Prisma.IssueGetPayload<{ include: { rule: true; subject: true } }>;

export interface IssueSource {
  ruleId: string;
  description?: string;
  severity: string;
  subjectUuid: string;
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

  findById(id: string): Promise<IssueWithRelations | null> {
    return this.prismaService.issue.findUnique({
      where: { id },
      include: { rule: true, subject: true },
    });
  }

  async countByKeys(keys: IssueSubjectKey[]): Promise<(IssueSubjectKey & { count: number })[]> {
    const groups = await this.prismaService.issue.groupBy({
      by: ['ruleId', 'subjectUuid'],
      where: { OR: keys },
      _count: { _all: true },
    });
    return groups.map(({ ruleId, subjectUuid, _count }) => ({ ruleId, subjectUuid, count: _count._all }));
  }

  countBySeverity(analysisResultId: string, severity: string): Promise<number> {
    return this.prismaService.issue.count({ where: { analysisResultId, severity } });
  }

  async findPage(
    analysisResultId: string,
    filters: { status?: string; severity?: string; ruleType?: string },
    limit: number,
    offset: number,
  ): Promise<{ items: IssueWithRelations[]; total: number }> {
    const where: Prisma.IssueWhereInput = {
      analysisResultId,
      status: filters.status,
      severity: filters.severity,
      rule: filters.ruleType ? { type: filters.ruleType } : undefined,
    };
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.issue.findMany({
        where,
        include: { rule: true, subject: true },
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.issue.count({ where }),
    ]);
    return { items, total };
  }
}
