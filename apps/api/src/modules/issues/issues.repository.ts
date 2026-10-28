import { Injectable } from '@nestjs/common';
import { IssueStatus } from '@tomato/constants';
import type { Issue } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';

interface IssueFilter {
  ruleId?: string;
  analysisContextId?: string;
  status?: IssueStatus;
}

@Injectable()
export class IssuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateIssueDto): Promise<Issue> {
    return this.prisma.issue.create({ data });
  }

  findById(id: string): Promise<Issue | null> {
    return this.prisma.issue.findUnique({ where: { id } });
  }

  async findMany(
    where: IssueFilter,
    limit: number,
    offset: number,
  ): Promise<{ items: Issue[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.issue.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prisma.issue.count({ where }),
    ]);
    return { items, total };
  }

  updateStatus(id: string, status: IssueStatus): Promise<Issue> {
    return this.prisma.issue.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.issue.delete({ where: { id } });
  }
}
