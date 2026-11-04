import { Injectable } from '@nestjs/common';
import { AnalysisResultStatus, type AnalysisSchema, type AnalysisSortField } from '@tomato/constants';
import { Prisma, type Analysis } from '../../generated/client';
import { type Ordering, orderByIds, toSqlOrderBy } from '../../common/sort/sort';
import type { StoredFile } from '../files/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_TREND_METRIC_TYPES } from './analyses.constants';
import {
  ANALYSIS_DATA_INCLUDE,
  LATEST_RESULT_INCLUDE,
  LATEST_RESULT_ORDER_BY,
  type AnalysisDetailRecord,
  type AnalysisTrendRecord,
  type MetricTrendPick,
  type AnalysisWithData,
  type AnalysisWithLatestResult,
} from './analyses.types';

const ORDER_BY: Record<AnalysisSortField, Prisma.Sql> = {
  title: Prisma.sql`a.title`,
  createdAt: Prisma.sql`a.created_at`,
  status: Prisma.sql`array_position(${Object.values(AnalysisResultStatus)}::text[], r.status::text)`,
  issueCount: Prisma.sql`r.issue_count`,
};

interface CreateAnalysisData {
  branchId: string;
  schema: AnalysisSchema;
  title: string;
  file?: StoredFile;
  databaseId?: string;
}

@Injectable()
export class AnalysesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ branchId, schema, title, file, databaseId }: CreateAnalysisData): Promise<Analysis> {
    return this.prismaService.analysis.create({
      data: {
        branchId,
        schema,
        title,
        apiData: file ? { create: file } : undefined,
        databaseData: databaseId ? { create: { databaseId } } : undefined,
      },
    });
  }

  findById(id: string): Promise<AnalysisWithData | null> {
    return this.prismaService.analysis.findUnique({ where: { id }, include: ANALYSIS_DATA_INCLUDE });
  }

  findDetailById(id: string): Promise<AnalysisDetailRecord | null> {
    return this.prismaService.analysis.findUnique({
      where: { id },
      include: { ...LATEST_RESULT_INCLUDE, ...ANALYSIS_DATA_INCLUDE, branch: true },
    });
  }

  async findPageByBranch(
    branchId: string,
    schema: AnalysisSchema,
    limit: number,
    offset: number,
    ordering: Ordering<AnalysisSortField> = [],
  ): Promise<{ items: AnalysisWithLatestResult[]; total: number }> {
    const orderBy = toSqlOrderBy(ordering, ORDER_BY);
    const [rows, total] = await this.prismaService.$transaction([
      this.prismaService.$queryRaw<{ id: string }[]>`
        SELECT a.id
        FROM analyses a
        LEFT JOIN LATERAL (
          SELECT status, issue_count FROM analysis_results
          WHERE analysis_id = a.id
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        ) r ON TRUE
        WHERE a.branch_id = ${branchId}::uuid AND a.schema = ${schema}
        ORDER BY ${orderBy} a.created_at DESC, a.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      this.prismaService.analysis.count({ where: { branchId, schema } }),
    ]);
    const ids = rows.map(({ id }) => id);
    const items = await this.prismaService.analysis.findMany({ where: { id: { in: ids } }, include: LATEST_RESULT_INCLUDE });
    return { items: orderByIds(ids, items), total };
  }

  countBySchema(branchId: string) {
    return this.prismaService.analysis.groupBy({ by: ['schema'], where: { branchId }, _count: { _all: true } });
  }

  findRecentByBranch(
    branchId: string,
    schema: AnalysisSchema,
    limit: number,
    picks: MetricTrendPick[],
  ): Promise<AnalysisTrendRecord[]> {
    const where: Prisma.MetricResultWhereInput = picks.length
      ? { OR: picks }
      : { subjectUuid: null, metric: { type: { in: [...DEFAULT_TREND_METRIC_TYPES] } } };
    return this.prismaService.analysis.findMany({
      where: { branchId, schema },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        createdAt: true,
        title: true,
        results: {
          orderBy: LATEST_RESULT_ORDER_BY,
          take: 1,
          select: {
            metricResults: {
              where,
              select: {
                value: true,
                subject: { select: { uuid: true, type: true, description: true } },
                metric: { select: { id: true, type: true, unit: true, description: true } },
              },
            },
          },
        },
      },
    });
  }
}
