import { Injectable } from '@nestjs/common';
import { IssueStatus } from '@tomato/constants';
import type { Issue } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';

interface IssueFilter {
  ruleId?: string;
  analysisContextId?: string;
  analysisResultId?: string;
  status?: IssueStatus;
}

export interface IssueSource {
  ruleId: string;
  analysisContextId: string;
  description?: string;
}

@Injectable()
export class IssuesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: CreateIssueDto): Promise<Issue> {
    return this.prismaService.issue.create({ data });
  }

  async createMany(analysisResultId: string, items: IssueSource[]): Promise<number> {
    const { count } = await this.prismaService.issue.createMany({
      data: items.map((item) => ({ ...item, analysisResultId })),
    });
    return count;
  }

  findById(id: string): Promise<Issue | null> {
    return this.prismaService.issue.findUnique({ where: { id } });
  }

  async findMany(
    where: IssueFilter,
    limit: number,
    offset: number,
  ): Promise<{ items: Issue[]; total: number }> {
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.issue.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prismaService.issue.count({ where }),
    ]);
    return { items, total };
  }

  updateStatus(id: string, status: IssueStatus): Promise<Issue> {
    return this.prismaService.issue.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.issue.delete({ where: { id } });
  }
}
