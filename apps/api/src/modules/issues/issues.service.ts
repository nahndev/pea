import { Injectable } from '@nestjs/common';
import { IssuesRepository, type IssueSource } from './issues.repository';

@Injectable()
export class IssuesService {
  constructor(private readonly issuesRepository: IssuesRepository) {}

  async createMany(analysisResultId: string, items: IssueSource[]): Promise<number> {
    if (!items.length) return 0;
    return this.issuesRepository.createMany(analysisResultId, items);
  }
}
