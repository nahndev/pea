import { Injectable } from '@nestjs/common';
import type { AnalysisContextType, IssueStatus, RuleType, Severity } from '@tomato/constants';
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

  countByContext(analysisResultId: string, analysisContextId: string, severity: Severity): Promise<number> {
    return this.issuesRepository.countByContext(analysisResultId, analysisContextId, severity);
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
        context: { file: issue.analysisContext.file, type: issue.analysisContext.type as AnalysisContextType },
      })),
      total,
    };
  }
}
