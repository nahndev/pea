import { ConflictException, NotFoundException } from '@nestjs/common';
import { ErrorCode, SortOrder } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import type { StorageService } from '../files/storage.service';
import { ReposRepository } from './repos.repository';
import { ReposService } from './repos.service';

const REPO_ID = '01a1e25b-5c6c-73bf-a633-0bce292b444d';
const REPO = { id: REPO_ID, name: 'feat/x', slug: 'feat-x' };

describe('ReposService findOrCreateByName', () => {
  let reposRepository: jest.Mocked<Pick<ReposRepository, 'findByName' | 'findBySlug' | 'findSlugsLike' | 'upsertByName'>>;
  let reposService: ReposService;

  beforeEach(() => {
    reposRepository = {
      findByName: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      findSlugsLike: jest.fn().mockResolvedValue(new Set()),
      upsertByName: jest.fn().mockResolvedValue(REPO),
    };
    reposService = new ReposService(reposRepository as unknown as ReposRepository, {} as StorageService);
  });

  it('returns the repo with that name', async () => {
    reposRepository.findByName.mockResolvedValue(REPO);
    await expect(reposService.findOrCreateByName('feat/x')).resolves.toBe(REPO);
    expect(reposRepository.upsertByName).not.toHaveBeenCalled();
  });

  it('falls back to the repo with that slug', async () => {
    reposRepository.findBySlug.mockResolvedValue(REPO);
    await expect(reposService.findOrCreateByName('feat-x')).resolves.toBe(REPO);
    expect(reposRepository.findBySlug).toHaveBeenCalledWith('feat-x');
    expect(reposRepository.upsertByName).not.toHaveBeenCalled();
  });

  it('creates the repo with a free slug', async () => {
    reposRepository.findSlugsLike.mockResolvedValue(new Set(['feat-x']));
    await reposService.findOrCreateByName('Feat X');
    expect(reposRepository.upsertByName).toHaveBeenCalledWith('Feat X', 'feat-x-2');
  });
});

describe('ReposService create', () => {
  let reposRepository: jest.Mocked<Pick<ReposRepository, 'create' | 'findSlugsLike'>>;
  let reposService: ReposService;

  beforeEach(() => {
    reposRepository = { create: jest.fn(), findSlugsLike: jest.fn().mockResolvedValue(new Set()) };
    reposService = new ReposService(reposRepository as unknown as ReposRepository, {} as StorageService);
  });

  it('creates the repo with its slug', async () => {
    reposRepository.create.mockResolvedValue(REPO);
    await expect(reposService.create('feat/x')).resolves.toEqual(REPO);
    expect(reposRepository.create).toHaveBeenCalledWith('feat/x', 'feat-x');
  });

  it('throws REPO_ALREADY_EXISTS on a unique violation', async () => {
    reposRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' }),
    );

    const error = await reposService.create('feat/x').catch((e: ConflictException) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({ code: ErrorCode.REPO_ALREADY_EXISTS });
  });

  it('rethrows other errors', async () => {
    const failure = new Error('db down');
    reposRepository.create.mockRejectedValue(failure);
    await expect(reposService.create('feat/x')).rejects.toBe(failure);
  });
});

describe('ReposService reads', () => {
  let reposRepository: jest.Mocked<Pick<ReposRepository, 'findById' | 'findBySlug' | 'findActivities'>>;
  let reposService: ReposService;

  beforeEach(() => {
    reposRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      findActivities: jest.fn(),
    };
    reposService = new ReposService(reposRepository as unknown as ReposRepository, {} as StorageService);
  });

  it('finds the repo by uuid', async () => {
    reposRepository.findById.mockResolvedValue(REPO);
    await expect(reposService.findOne(REPO_ID)).resolves.toBe(REPO);
    expect(reposRepository.findBySlug).not.toHaveBeenCalled();
  });

  it('finds the repo by slug without querying the id', async () => {
    reposRepository.findBySlug.mockResolvedValue(REPO);
    await expect(reposService.findOne('feat-x')).resolves.toBe(REPO);
    expect(reposRepository.findById).not.toHaveBeenCalled();
  });

  it('throws REPO_NOT_FOUND for an unknown id or slug', async () => {
    const error = await reposService.findOne('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.REPO_NOT_FOUND });
  });

  it('serialises the latest analysis date and forwards the filters', async () => {
    const latestAnalysisAt = new Date('2026-10-02T10:00:00.000Z');
    reposRepository.findActivities.mockResolvedValue({
      items: [{ id: 'br-1', name: 'feat/x', slug: 'feat-x', analysisCount: 3, latestAnalysisAt }],
      total: 1,
    });

    const ordering = [{ field: 'name' as const, order: SortOrder.DESC }];
    const page = await reposService.findAll({ search: 'feat', limit: 10, offset: 5, ordering });

    expect(reposRepository.findActivities).toHaveBeenCalledWith('feat', 10, 5, ordering);
    expect(page).toEqual({
      items: [{ id: 'br-1', name: 'feat/x', slug: 'feat-x', analysisCount: 3, latestAnalysisAt: latestAnalysisAt.toISOString() }],
      total: 1,
    });
  });

  it('returns a null latest analysis date for a repo without analyses', async () => {
    reposRepository.findActivities.mockResolvedValue({
      items: [{ id: 'br-2', name: 'feat/y', slug: 'feat-y', analysisCount: 0, latestAnalysisAt: null }],
      total: 1,
    });

    const page = await reposService.findAll({ limit: 10, offset: 0 });

    expect(page.items).toEqual([{ id: 'br-2', name: 'feat/y', slug: 'feat-y', analysisCount: 0, latestAnalysisAt: null }]);
  });
});

describe('ReposService remove', () => {
  let reposRepository: jest.Mocked<Pick<ReposRepository, 'findById' | 'findBySlug' | 'delete'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'remove'>>;
  let reposService: ReposService;

  beforeEach(() => {
    reposRepository = { findById: jest.fn(), findBySlug: jest.fn().mockResolvedValue(null), delete: jest.fn() };
    storageService = { remove: jest.fn() };
    reposService = new ReposService(
      reposRepository as unknown as ReposRepository,
      storageService as unknown as StorageService,
    );
  });

  it('deletes the repo found by slug and its stored log files', async () => {
    reposRepository.findBySlug.mockResolvedValue(REPO);
    reposRepository.delete.mockResolvedValue([{ path: 'a' }, { path: 'b' }]);
    storageService.remove.mockResolvedValue();

    await reposService.remove('feat-x');

    expect(reposRepository.delete).toHaveBeenCalledWith(REPO_ID);
    expect(storageService.remove).toHaveBeenCalledWith([{ path: 'a' }, { path: 'b' }]);
  });

  it('ignores file cleanup failures', async () => {
    reposRepository.findById.mockResolvedValue(REPO);
    reposRepository.delete.mockResolvedValue([{ path: 'a' }]);
    storageService.remove.mockRejectedValue(new Error('disk'));

    await expect(reposService.remove(REPO_ID)).resolves.toBeUndefined();
  });

  it('throws REPO_NOT_FOUND without deleting', async () => {
    reposRepository.findById.mockResolvedValue(null);

    const error = await reposService.remove('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.REPO_NOT_FOUND });
    expect(reposRepository.delete).not.toHaveBeenCalled();
  });
});
