import { Injectable } from '@nestjs/common';
import type { IssueStatus, RuleType, Severity } from '@tomato/constants';
import type { IssueView, Paginated } from '@tomato/types';
import { toSubjectView } from '../subjects/subject';
import { SubjectsService } from '../subjects/subjects.service';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { IssuesRepository } from './issues.repository';
import type { NewIssue } from './issues.types';

@Injectable()
export class IssuesService {
  constructor(
    private readonly issuesRepository: IssuesRepository,
    private readonly subjectsService: SubjectsService,
  ) {}

  async createMany(analysisResultId: string, items: NewIssue[]): Promise<number> {
    if (!items.length) return 0;
    await this.subjectsService.createMany(items.flatMap(({ subject }) => (subject ? [subject] : [])));
    return this.issuesRepository.createMany(
      analysisResultId,
      items.map(({ subject, ...issue }) => ({ ...issue, subjectUuid: subject?.uuid ?? null })),
    );
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
        subject: issue.subject && toSubjectView(issue.subject),
        createdAt: issue.createdAt.toISOString(),
        rule: { type: issue.rule.type as RuleType, description: issue.rule.description },
      })),
      total,
    };
  }
}
