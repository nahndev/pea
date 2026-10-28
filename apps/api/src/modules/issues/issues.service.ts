import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import type { Issue } from '../../generated/client';
import { AnalysisContextsService } from '../analysis-contexts/analysis-contexts.service';
import { RulesService } from '../rules/rules.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesRepository, type IssueSource } from './issues.repository';

@Injectable()
export class IssuesService {
  constructor(
    private readonly issuesRepository: IssuesRepository,
    private readonly rulesService: RulesService,
    private readonly analysisContextsService: AnalysisContextsService,
  ) {}

  async create(dto: CreateIssueDto): Promise<Issue> {
    await Promise.all([
      this.rulesService.findOne(dto.ruleId),
      this.analysisContextsService.findOne(dto.analysisContextId),
    ]);
    return this.issuesRepository.create(dto);
  }

  async createMany(analysisResultId: string, items: IssueSource[]): Promise<number> {
    if (!items.length) return 0;
    return this.issuesRepository.createMany(analysisResultId, items);
  }

  findAll({ limit, offset, ...filter }: ListIssuesQueryDto): Promise<Paginated<Issue>> {
    return this.issuesRepository.findMany(filter, limit, offset);
  }

  async findOne(id: string): Promise<Issue> {
    const issue = await this.issuesRepository.findById(id);
    if (!issue) throw new NotFoundException({ code: ErrorCode.ISSUE_NOT_FOUND });
    return issue;
  }

  async update(id: string, { status }: UpdateIssueDto): Promise<Issue> {
    await this.findOne(id);
    return this.issuesRepository.updateStatus(id, status);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.issuesRepository.delete(id);
  }
}
