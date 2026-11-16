import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { BranchSummary, Paginated } from '@tomato/types';
import { isUUID } from 'class-validator';
import { Prisma, type Branch } from '../../generated/client';
import { StorageService } from '../files/storage.service';
import { nextFreeSlug, toBranchSlug } from './branch-slug';
import { BranchesRepository } from './branches.repository';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class BranchesService {
  constructor(
    private readonly branchesRepository: BranchesRepository,
    private readonly storageService: StorageService,
  ) {}

  /** Finds the branch by name, then by slug, or creates it */
  async findOrCreateByName(name: string): Promise<Branch> {
    const slug = toBranchSlug(name);
    const branch = (await this.branchesRepository.findByName(name)) ?? (await this.branchesRepository.findBySlug(slug));
    return branch ?? this.branchesRepository.upsertByName(name, await this.freeSlug(slug));
  }

  async create(name: string): Promise<Branch> {
    try {
      return await this.branchesRepository.create(name, await this.freeSlug(toBranchSlug(name)));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.BRANCH_ALREADY_EXISTS });
      }
      throw error;
    }
  }

  /** Finds the branch by uuid or slug */
  async findOne(idOrSlug: string): Promise<Branch> {
    const byId = isUUID(idOrSlug) ? await this.branchesRepository.findById(idOrSlug) : null;
    const branch = byId ?? (await this.branchesRepository.findBySlug(idOrSlug));
    if (!branch) throw new NotFoundException({ code: ErrorCode.BRANCH_NOT_FOUND });
    return branch;
  }

  async remove(idOrSlug: string): Promise<void> {
    const { id } = await this.findOne(idOrSlug);
    const files = await this.branchesRepository.delete(id);
    await this.storageService.remove(files).catch(() => undefined);
  }

  async findAll({ search, limit, offset, ordering }: ListBranchesQueryDto): Promise<Paginated<BranchSummary>> {
    const { items, total } = await this.branchesRepository.findActivities(search, limit, offset, ordering);
    return {
      items: items.map(({ id, name, slug, analysisCount, latestAnalysisAt }) => ({
        id,
        name,
        slug,
        analysisCount,
        latestAnalysisAt: latestAnalysisAt?.toISOString() ?? null,
      })),
      total,
    };
  }

  private async freeSlug(slug: string): Promise<string> {
    return nextFreeSlug(slug, await this.branchesRepository.findSlugsLike(slug));
  }
}
