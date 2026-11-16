import { Injectable } from '@nestjs/common';
import type { BranchSortField } from '@tomato/constants';
import { Prisma, type Branch } from '../../generated/client';
import { type Ordering, toSqlOrderBy } from '../../common/sort/sort';
import { PrismaService } from '../../prisma/prisma.service';

const ORDER_BY: Record<BranchSortField, Prisma.Sql> = {
  name: Prisma.sql`b.name`,
  analysisCount: Prisma.sql`COUNT(a.id)`,
  latestAnalysisAt: Prisma.sql`MAX(a.created_at)`,
};

export interface BranchActivity extends Branch {
  analysisCount: number;
  latestAnalysisAt: Date | null;
}

@Injectable()
export class BranchesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsertByName(name: string, slug: string): Promise<Branch> {
    return this.prismaService.branch.upsert({ where: { name }, create: { name, slug }, update: {} });
  }

  findById(id: string): Promise<Branch | null> {
    return this.prismaService.branch.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Branch | null> {
    return this.prismaService.branch.findUnique({ where: { name } });
  }

  findBySlug(slug: string): Promise<Branch | null> {
    return this.prismaService.branch.findUnique({ where: { slug } });
  }

  /** Slugs equal to `slug` or suffixed from it (`slug-…`) */
  async findSlugsLike(slug: string): Promise<Set<string>> {
    const rows = await this.prismaService.branch.findMany({
      where: { OR: [{ slug }, { slug: { startsWith: `${slug}-` } }] },
      select: { slug: true },
    });
    return new Set(rows.map((row) => row.slug));
  }

  create(name: string, slug: string): Promise<Branch> {
    return this.prismaService.branch.create({ data: { name, slug } });
  }

  /** Deletes the branch with its analyses and returns their stored log paths */
  delete(id: string): Promise<{ path: string }[]> {
    return this.prismaService.$transaction(async (tx) => {
      const files = await tx.apiAnalysisData.findMany({ where: { analysis: { branchId: id } }, select: { path: true } });
      await tx.branch.delete({ where: { id } });
      return files;
    });
  }

  async findActivities(
    search: string | undefined,
    limit: number,
    offset: number,
    ordering: Ordering<BranchSortField> = [],
  ): Promise<{ items: BranchActivity[]; total: number }> {
    const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : '%';
    const orderBy = toSqlOrderBy(ordering, ORDER_BY);
    const [items, total] = await Promise.all([
      this.prismaService.$queryRaw<BranchActivity[]>`
        SELECT b.id, b.name, b.slug, COUNT(a.id)::int AS "analysisCount", MAX(a.created_at) AS "latestAnalysisAt"
        FROM branches b
        LEFT JOIN analyses a ON a.branch_id = b.id
        WHERE b.name ILIKE ${pattern}
        GROUP BY b.id
        ORDER BY ${orderBy} MAX(a.created_at) DESC NULLS LAST, b.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      this.prismaService.branch.count({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      }),
    ]);
    return { items, total };
  }
}
