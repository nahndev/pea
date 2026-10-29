import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { BranchSummary, Paginated } from '@tomato/types';
import { Prisma, type Branch } from '../../generated/client';
import { BranchesRepository } from './branches.repository';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class BranchesService {
  constructor(private readonly branchesRepository: BranchesRepository) {}

  findOrCreateByName(name: string): Promise<Branch> {
    return this.branchesRepository.upsertByName(name);
  }

  async create(name: string): Promise<Branch> {
    try {
      return await this.branchesRepository.create(name);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.BRANCH_ALREADY_EXISTS });
      }
      throw error;
    }
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
        latestAnalysisAt: latestAnalysisAt?.toISOString() ?? null,
      })),
      total,
    };
  }
}
