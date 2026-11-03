import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ErrorCode,
  type IssueStatus,
  type IssueSubjectStatus,
  type RuleType,
  type Severity,
} from "@tomato/constants";
import type { IssueSubjectView, IssueView, Paginated } from "@tomato/types";
import type { IssueSubject } from "../../generated/client";
import { DEFAULT_SUBJECT, toSubjectView } from "../subjects/subject";
import { SubjectsService } from "../subjects/subjects.service";
import { ListIssuesQueryDto } from "./dto/list-issues-query.dto";
import { UpdateIssueSubjectDto } from "./dto/update-issue-subject.dto";
import {
  type IssueSubjectKey,
  IssueSubjectsRepository,
} from "./issue-subjects.repository";
import { type IssueWithRelations, IssuesRepository } from "./issues.repository";
import type { NewIssue } from "./issues.types";

const toKey = ({ ruleId, subjectUuid }: IssueSubjectKey) =>
  `${ruleId}:${subjectUuid}`;

@Injectable()
export class IssuesService {
  constructor(
    private readonly issuesRepository: IssuesRepository,
    private readonly issueSubjectsRepository: IssueSubjectsRepository,
    private readonly subjectsService: SubjectsService,
  ) {}

  async createMany(
    analysisResultId: string,
    items: NewIssue[],
  ): Promise<number> {
    if (!items.length) return 0;
    const issues = items.map(({ subject = DEFAULT_SUBJECT, ...issue }) => ({
      ...issue,
      subject,
    }));
    await this.subjectsService.createMany(issues.map(({ subject }) => subject));
    await this.issueSubjectsRepository.createMany(
      issues.map(({ ruleId, subject }) => ({
        ruleId,
        subjectUuid: subject.uuid,
      })),
    );
    return this.issuesRepository.createMany(
      analysisResultId,
      issues.map(({ subject, ...issue }) => ({
        ...issue,
        subjectUuid: subject.uuid,
      })),
    );
  }

  countBySeverity(
    analysisResultId: string,
    severity: Severity,
  ): Promise<number> {
    return this.issuesRepository.countBySeverity(analysisResultId, severity);
  }

  async findPage(
    analysisResultId: string,
    { status, severity, ruleType, limit, offset }: ListIssuesQueryDto,
  ): Promise<Paginated<IssueView>> {
    const { items, total } = await this.issuesRepository.findPage(
      analysisResultId,
      { status, severity, ruleType },
      limit,
      offset,
    );
    return { items: await this.toViews(items), total };
  }

  async findOne(id: string): Promise<IssueView> {
    const issue = await this.issuesRepository.findById(id);
    if (!issue) throw new NotFoundException({ code: ErrorCode.ISSUE_NOT_FOUND });
    const [view] = await this.toViews([issue]);
    return view;
  }

  async updateSubject(
    id: string,
    { status }: UpdateIssueSubjectDto,
  ): Promise<IssueSubjectView> {
    const issueSubject = await this.issueSubjectsRepository.findById(id);
    if (!issueSubject)
      throw new NotFoundException({ code: ErrorCode.ISSUE_SUBJECT_NOT_FOUND });
    return this.toIssueSubjectView(
      await this.issueSubjectsRepository.update(id, { status }),
    );
  }

  private async toViews(issues: IssueWithRelations[]): Promise<IssueView[]> {
    if (!issues.length) return [];
    const keys = issues.map(({ ruleId, subjectUuid }) => ({ ruleId, subjectUuid }));
    const [issueSubjects, counts] = await Promise.all([
      this.issueSubjectsRepository.findByKeys(keys),
      this.issuesRepository.countByKeys(keys),
    ]);
    const issueSubjectByKey = new Map(issueSubjects.map((issueSubject) => [toKey(issueSubject), issueSubject]));
    const countByKey = new Map(counts.map(({ count, ...key }) => [toKey(key), count]));
    return issues.map((issue) =>
      this.toView(issue, issueSubjectByKey.get(toKey(issue)), countByKey.get(toKey(issue)) ?? 0),
    );
  }

  private toView(
    issue: IssueWithRelations,
    issueSubject: IssueSubject | undefined,
    issueCount: number,
  ): IssueView {
    return {
      id: issue.id,
      status: issue.status as IssueStatus,
      severity: issue.severity as Severity,
      description: issue.description,
      subject: toSubjectView(issue.subject),
      issueSubject: issueSubject ? this.toIssueSubjectView(issueSubject) : null,
      issueCount,
      createdAt: issue.createdAt.toISOString(),
      rule: {
        id: issue.rule.id,
        type: issue.rule.type as RuleType,
        description: issue.rule.description,
      },
    };
  }

  private toIssueSubjectView({ id, status }: IssueSubject): IssueSubjectView {
    return { id, status: status as IssueSubjectStatus };
  }
}
