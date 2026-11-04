import { Injectable } from '@nestjs/common';
import { type IssueSortField, IssueSubjectStatus, Severity } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { type Ordering, orderByIds, toSqlOrderBy } from '../../common/sort/sort';
import { PrismaService } from '../../prisma/prisma.service';
import type { IssueSubjectKey } from './issue-subjects.repository';

const ISSUE_INCLUDE = { rule: true, subject: true, issueSubject: true } as const satisfies Prisma.IssueInclude;

const ORDER_BY: Record<IssueSortField, Prisma.Sql> = {
  severity: Prisma.sql`array_position(${Object.values(Severity)}::text[], i.severity::text)`,
  rule: Prisma.sql`r.type`,
  description: Prisma.sql`COALESCE(i.description, r.description)`,
  status: Prisma.sql`array_position(${Object.values(IssueSubjectStatus)}::text[], s.status::text)`,
  issueCount: Prisma.sql`(SELECT COUNT(*) FROM issues c WHERE c.rule_id = i.rule_id AND c.subject_uuid = i.subject_uuid)`,
  createdAt: Prisma.sql`i.created_at`,
};

export type IssueWithRelations = Prisma.IssueGetPayload<{ include: typeof ISSUE_INCLUDE }>;

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
      include: ISSUE_INCLUDE,
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
    ordering: Ordering<IssueSortField> = [],
  ): Promise<{ items: IssueWithRelations[]; total: number }> {
    const where: Prisma.IssueWhereInput = {
      analysisResultId,
      issueSubject: filters.status ? { status: filters.status } : undefined,
      severity: filters.severity,
      rule: filters.ruleType ? { type: filters.ruleType } : undefined,
    };
    const orderBy = toSqlOrderBy(ordering, ORDER_BY);
    const [rows, total] = await this.prismaService.$transaction([
      this.prismaService.$queryRaw<{ id: string }[]>`
        SELECT i.id
        FROM issues i
        JOIN rules r ON r.id = i.rule_id
        JOIN issue_subjects s ON s.rule_id = i.rule_id AND s.subject_uuid = i.subject_uuid
        WHERE i.analysis_result_id = ${analysisResultId}::uuid
          ${filters.status ? Prisma.sql`AND s.status = ${filters.status}` : Prisma.empty}
          ${filters.severity ? Prisma.sql`AND i.severity = ${filters.severity}` : Prisma.empty}
          ${filters.ruleType ? Prisma.sql`AND r.type = ${filters.ruleType}` : Prisma.empty}
        ORDER BY ${orderBy} i.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      this.prismaService.issue.count({ where }),
    ]);
    const ids = rows.map(({ id }) => id);
    const items = await this.prismaService.issue.findMany({ where: { id: { in: ids } }, include: ISSUE_INCLUDE });
    return { items: orderByIds(ids, items), total };
  }
}
