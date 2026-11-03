import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode, type IssueStatus, type IssueSubjectStatus, type RuleType, type Severity } from '@tomato/constants';
import type { IssueSubjectView, IssueView, Paginated } from '@tomato/types';
import type { IssueSubject } from '../../generated/client';
import { toSubjectView } from '../subjects/subject';
import { SubjectsService } from '../subjects/subjects.service';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { UpdateIssueSubjectDto } from './dto/update-issue-subject.dto';
import { type IssueSubjectKey, IssueSubjectsRepository } from './issue-subjects.repository';
import { IssuesRepository } from './issues.repository';
import type { NewIssue } from './issues.types';

const toKey = ({ ruleId, subjectUuid }: IssueSubjectKey) => `${ruleId}:${subjectUuid}`;

@Injectable()
export class IssuesService {
  constructor(
    private readonly issuesRepository: IssuesRepository,
    private readonly issueSubjectsRepository: IssueSubjectsRepository,
    private readonly subjectsService: SubjectsService,
  ) {}

  async createMany(analysisResultId: string, items: NewIssue[]): Promise<number> {
    if (!items.length) return 0;
    const subjects = items.flatMap(({ subject }) => (subject ? [subject] : []));
    await this.subjectsService.createMany(subjects);
    const keys = items.flatMap(({ ruleId, subject }) => (subject ? [{ ruleId, subjectUuid: subject.uuid }] : []));
    if (keys.length) await this.issueSubjectsRepository.createMany(keys);
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
    const keys = items.flatMap(({ ruleId, subjectUuid }) => (subjectUuid ? [{ ruleId, subjectUuid }] : []));
    const issueSubjects = keys.length ? await this.issueSubjectsRepository.findByKeys(keys) : [];
    const issueSubjectByKey = new Map(issueSubjects.map((issueSubject) => [toKey(issueSubject), issueSubject]));
    return {
      items: items.map((issue) => {
        const issueSubject = issue.subjectUuid && issueSubjectByKey.get(toKey({ ruleId: issue.ruleId, subjectUuid: issue.subjectUuid }));
        return {
          id: issue.id,
          status: issue.status as IssueStatus,
          severity: issue.severity as Severity,
          description: issue.description,
          subject: issue.subject && toSubjectView(issue.subject),
          issueSubject: issueSubject ? this.toIssueSubjectView(issueSubject) : null,
          createdAt: issue.createdAt.toISOString(),
          rule: { type: issue.rule.type as RuleType, description: issue.rule.description },
        };
      }),
      total,
    };
  }

  async updateSubject(id: string, { status }: UpdateIssueSubjectDto): Promise<IssueSubjectView> {
    const issueSubject = await this.issueSubjectsRepository.findById(id);
    if (!issueSubject) throw new NotFoundException({ code: ErrorCode.ISSUE_SUBJECT_NOT_FOUND });
    return this.toIssueSubjectView(await this.issueSubjectsRepository.update(id, { status }));
  }

  private toIssueSubjectView({ id, status }: IssueSubject): IssueSubjectView {
    return { id, status: status as IssueSubjectStatus };
  }
}
