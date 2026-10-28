import { Injectable } from '@nestjs/common';
import type { Branch } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface BranchActivity extends Branch {
  analysisCount: number;
  latestAnalysisAt: Date;
}

@Injectable()
export class BranchesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsertByName(name: string): Promise<Branch> {
    return this.prismaService.branch.upsert({ where: { name }, create: { name }, update: {} });
  }

  findById(id: string): Promise<Branch | null> {
    return this.prismaService.branch.findUnique({ where: { id } });
  }

  async findActivities(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: BranchActivity[]; total: number }> {
    const branchWhere = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const [groups, total] = await Promise.all([
      this.prismaService.analysis.groupBy({
        by: ['branchId'],
        where: { branch: branchWhere },
        _count: { _all: true },
        _max: { createdAt: true },
        orderBy: [{ _max: { createdAt: 'desc' } }, { branchId: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prismaService.branch.count({ where: { ...branchWhere, analyses: { some: {} } } }),
    ]);
    const branches = await this.prismaService.branch.findMany({
      where: { id: { in: groups.map((group) => group.branchId) } },
    });
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));
    const items = groups.flatMap((group) => {
      const branch = branchById.get(group.branchId);
      if (!branch || !group._max.createdAt) return [];
      return [{ ...branch, analysisCount: group._count._all, latestAnalysisAt: group._max.createdAt }];
    });
    return { items, total };
  }
}
