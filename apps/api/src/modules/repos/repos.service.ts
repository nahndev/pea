import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { RepoSummary, Paginated } from '@tomato/types';
import { isUUID } from 'class-validator';
import { Prisma, type Repo } from '../../generated/client';
import { StorageService } from '../files/storage.service';
import { nextFreeSlug, toRepoSlug } from './repo-slug';
import { ReposRepository } from './repos.repository';
import { ListReposQueryDto } from './dto/list-repos-query.dto';

const UNIQUE_VIOLATION_CODE = 'P2002';

@Injectable()
export class ReposService {
  constructor(
    private readonly reposRepository: ReposRepository,
    private readonly storageService: StorageService,
  ) {}

  /** Finds the repo by name, then by slug, or creates it */
  async findOrCreateByName(name: string): Promise<Repo> {
    const slug = toRepoSlug(name);
    const repo = (await this.reposRepository.findByName(name)) ?? (await this.reposRepository.findBySlug(slug));
    return repo ?? this.reposRepository.upsertByName(name, await this.freeSlug(slug));
  }

  async create(name: string): Promise<Repo> {
    try {
      return await this.reposRepository.create(name, await this.freeSlug(toRepoSlug(name)));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.REPO_ALREADY_EXISTS });
      }
      throw error;
    }
  }

  /** Finds the repo by uuid or slug */
  async findOne(idOrSlug: string): Promise<Repo> {
    const byId = isUUID(idOrSlug) ? await this.reposRepository.findById(idOrSlug) : null;
    const repo = byId ?? (await this.reposRepository.findBySlug(idOrSlug));
    if (!repo) throw new NotFoundException({ code: ErrorCode.REPO_NOT_FOUND });
    return repo;
  }

  async remove(idOrSlug: string): Promise<void> {
    const { id } = await this.findOne(idOrSlug);
    const files = await this.reposRepository.delete(id);
    await this.storageService.remove(files).catch(() => undefined);
  }

  async findAll({ search, limit, offset, ordering }: ListReposQueryDto): Promise<Paginated<RepoSummary>> {
    const { items, total } = await this.reposRepository.findActivities(search, limit, offset, ordering);
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
    return nextFreeSlug(slug, await this.reposRepository.findSlugsLike(slug));
  }
}
