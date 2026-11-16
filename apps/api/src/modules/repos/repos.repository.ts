import { Injectable } from '@nestjs/common';
import type { RepoSortField } from '@tomato/constants';
import { Prisma, type Repo } from '../../generated/client';
import { type Ordering, toSqlOrderBy } from '../../common/sort/sort';
import { PrismaService } from '../../prisma/prisma.service';

const ORDER_BY: Record<RepoSortField, Prisma.Sql> = {
  name: Prisma.sql`b.name`,
  analysisCount: Prisma.sql`COUNT(a.id)`,
  latestAnalysisAt: Prisma.sql`MAX(a.created_at)`,
};

export interface RepoActivity extends Repo {
  analysisCount: number;
  latestAnalysisAt: Date | null;
}

@Injectable()
export class ReposRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsertByName(name: string, slug: string): Promise<Repo> {
    return this.prismaService.repo.upsert({ where: { name }, create: { name, slug }, update: {} });
  }

  findById(id: string): Promise<Repo | null> {
    return this.prismaService.repo.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Repo | null> {
    return this.prismaService.repo.findUnique({ where: { name } });
  }

  findBySlug(slug: string): Promise<Repo | null> {
    return this.prismaService.repo.findUnique({ where: { slug } });
  }

  /** Slugs equal to `slug` or suffixed from it (`slug-…`) */
  async findSlugsLike(slug: string): Promise<Set<string>> {
    const rows = await this.prismaService.repo.findMany({
      where: { OR: [{ slug }, { slug: { startsWith: `${slug}-` } }] },
      select: { slug: true },
    });
    return new Set(rows.map((row) => row.slug));
  }

  create(name: string, slug: string): Promise<Repo> {
    return this.prismaService.repo.create({ data: { name, slug } });
  }

  /** Deletes the repo with its analyses and returns their stored log paths */
  delete(id: string): Promise<{ path: string }[]> {
    return this.prismaService.$transaction(async (tx) => {
      const files = await tx.apiAnalysisData.findMany({ where: { analysis: { repoId: id } }, select: { path: true } });
      await tx.repo.delete({ where: { id } });
      return files;
    });
  }

  async findActivities(
    search: string | undefined,
    limit: number,
    offset: number,
    ordering: Ordering<RepoSortField> = [],
  ): Promise<{ items: RepoActivity[]; total: number }> {
    const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : '%';
    const orderBy = toSqlOrderBy(ordering, ORDER_BY);
    const [items, total] = await Promise.all([
      this.prismaService.$queryRaw<RepoActivity[]>`
        SELECT b.id, b.name, b.slug, COUNT(a.id)::int AS "analysisCount", MAX(a.created_at) AS "latestAnalysisAt"
        FROM repos b
        LEFT JOIN analyses a ON a.repo_id = b.id
        WHERE b.name ILIKE ${pattern}
        GROUP BY b.id
        ORDER BY ${orderBy} MAX(a.created_at) DESC NULLS LAST, b.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      this.prismaService.repo.count({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      }),
    ]);
    return { items, total };
  }
}
