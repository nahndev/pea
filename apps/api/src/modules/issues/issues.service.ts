import { Injectable } from '@nestjs/common';
import type { IssueStatus, RuleType, Severity } from '@tomato/constants';
import type { IssueView, Paginated } from '@tomato/types';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { IssuesRepository, type IssueSource } from './issues.repository';

@Injectable()
export class IssuesService {
  constructor(private readonly issuesRepository: IssuesRepository) {}

  async createMany(analysisResultId: string, items: IssueSource[]): Promise<number> {
    if (!items.length) return 0;
    return this.issuesRepository.createMany(analysisResultId, items);
  }

  countBySeverity(analysisResultId: string, severity: Severity): Promise<number> {
    return this.issuesRepository.countBySeverity(analysisResultId, severity);
  }

  async findPage(
    analysisResultId: string,
    { status, severity, ruleType, limit, offset }: ListIssuesQueryDto,
  ): Promise<Paginated<IssueView>> {
    const { items, total } = await this.issuesRepository.findPage(analysisResultId, { status, severity, ruleType }, limit, offset);
    return {
      items: items.map((issue) => ({
        id: issue.id,
        status: issue.status as IssueStatus,
        severity: issue.severity as Severity,
        description: issue.description,
        createdAt: issue.createdAt.toISOString(),
        rule: { type: issue.rule.type as RuleType, description: issue.rule.description },
      })),
      total,
    };
  }
}
