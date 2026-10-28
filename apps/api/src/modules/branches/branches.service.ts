import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { BranchSummary, Paginated } from '@tomato/types';
import type { Branch } from '../../generated/client';
import { BranchesRepository } from './branches.repository';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly branchesRepository: BranchesRepository) {}

  findOrCreateByName(name: string): Promise<Branch> {
    return this.branchesRepository.upsertByName(name);
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchesRepository.findById(id);
    if (!branch) throw new NotFoundException({ code: ErrorCode.BRANCH_NOT_FOUND });
    return branch;
  }

  async findAll({ search, limit, offset }: ListBranchesQueryDto): Promise<Paginated<BranchSummary>> {
    const { items, total } = await this.branchesRepository.findActivities(search, limit, offset);
    return {
      items: items.map(({ id, name, analysisCount, latestAnalysisAt }) => ({
        id,
        name,
        analysisCount,
        latestAnalysisAt: latestAnalysisAt.toISOString(),
      })),
      total,
    };
  }
}
