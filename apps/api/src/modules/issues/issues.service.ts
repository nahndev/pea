import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import type { Issue } from '../../generated/client';
import { AnalysisContextsService } from '../analysis-contexts/analysis-contexts.service';
import { RulesService } from '../rules/rules.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesRepository } from './issues.repository';

@Injectable()
export class IssuesService {
  constructor(
    private readonly repository: IssuesRepository,
    private readonly rulesService: RulesService,
    private readonly analysisContextsService: AnalysisContextsService,
  ) {}

  async create(dto: CreateIssueDto): Promise<Issue> {
    await Promise.all([
      this.rulesService.findOne(dto.ruleId),
      this.analysisContextsService.findOne(dto.analysisContextId),
    ]);
    return this.repository.create(dto);
  }

  findAll({ limit, offset, ...filter }: ListIssuesQueryDto): Promise<Paginated<Issue>> {
    return this.repository.findMany(filter, limit, offset);
  }

  async findOne(id: string): Promise<Issue> {
    const issue = await this.repository.findById(id);
    if (!issue) throw new NotFoundException({ code: ErrorCode.ISSUE_NOT_FOUND });
    return issue;
  }

  async update(id: string, { status }: UpdateIssueDto): Promise<Issue> {
    await this.findOne(id);
    return this.repository.updateStatus(id, status);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
