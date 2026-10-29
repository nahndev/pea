import { Injectable } from '@nestjs/common';
import type { Branch } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface BranchActivity extends Branch {
  analysisCount: number;
  latestAnalysisAt: Date | null;
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

  create(name: string): Promise<Branch> {
    return this.prismaService.branch.create({ data: { name } });
  }

  async findActivities(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: BranchActivity[]; total: number }> {
    const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : '%';
    const [items, total] = await Promise.all([
      this.prismaService.$queryRaw<BranchActivity[]>`
        SELECT b.id, b.name, COUNT(a.id)::int AS "analysisCount", MAX(a.created_at) AS "latestAnalysisAt"
        FROM branches b
        LEFT JOIN analyses a ON a.branch_id = b.id
        WHERE b.name ILIKE ${pattern}
        GROUP BY b.id
        ORDER BY MAX(a.created_at) DESC NULLS LAST, b.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      this.prismaService.branch.count({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      }),
    ]);
    return { items, total };
  }
}
