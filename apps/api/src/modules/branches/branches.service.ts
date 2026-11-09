import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { BranchSummary, Paginated } from '@tomato/types';
import { Prisma, type Branch } from '../../generated/client';
import { StorageService } from '../files/storage.service';
import { BranchesRepository } from './branches.repository';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class BranchesService {
  constructor(
    private readonly branchesRepository: BranchesRepository,
    private readonly storageService: StorageService,
  ) {}

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

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const files = await this.branchesRepository.delete(id);
    await this.storageService.remove(files).catch(() => undefined);
  }

  async findAll({ search, limit, offset, ordering }: ListBranchesQueryDto): Promise<Paginated<BranchSummary>> {
    const { items, total } = await this.branchesRepository.findActivities(search, limit, offset, ordering);
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
