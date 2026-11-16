import { ConflictException, NotFoundException } from '@nestjs/common';
import { ErrorCode, SortOrder } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import type { StorageService } from '../files/storage.service';
import { BranchesRepository } from './branches.repository';
import { BranchesService } from './branches.service';

const BRANCH_ID = '01a1e25b-5c6c-73bf-a633-0bce292b444d';
const BRANCH = { id: BRANCH_ID, name: 'feat/x', slug: 'feat-x' };

describe('BranchesService findOrCreateByName', () => {
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'findByName' | 'findBySlug' | 'findSlugsLike' | 'upsertByName'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = {
      findByName: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      findSlugsLike: jest.fn().mockResolvedValue(new Set()),
      upsertByName: jest.fn().mockResolvedValue(BRANCH),
    };
    branchesService = new BranchesService(branchesRepository as unknown as BranchesRepository, {} as StorageService);
  });

  it('returns the branch with that name', async () => {
    branchesRepository.findByName.mockResolvedValue(BRANCH);
    await expect(branchesService.findOrCreateByName('feat/x')).resolves.toBe(BRANCH);
    expect(branchesRepository.upsertByName).not.toHaveBeenCalled();
  });

  it('falls back to the branch with that slug', async () => {
    branchesRepository.findBySlug.mockResolvedValue(BRANCH);
    await expect(branchesService.findOrCreateByName('feat-x')).resolves.toBe(BRANCH);
    expect(branchesRepository.findBySlug).toHaveBeenCalledWith('feat-x');
    expect(branchesRepository.upsertByName).not.toHaveBeenCalled();
  });

  it('creates the branch with a free slug', async () => {
    branchesRepository.findSlugsLike.mockResolvedValue(new Set(['feat-x']));
    await branchesService.findOrCreateByName('Feat X');
    expect(branchesRepository.upsertByName).toHaveBeenCalledWith('Feat X', 'feat-x-2');
  });
});

describe('BranchesService create', () => {
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'create' | 'findSlugsLike'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = { create: jest.fn(), findSlugsLike: jest.fn().mockResolvedValue(new Set()) };
    branchesService = new BranchesService(branchesRepository as unknown as BranchesRepository, {} as StorageService);
  });

  it('creates the branch with its slug', async () => {
    branchesRepository.create.mockResolvedValue(BRANCH);
    await expect(branchesService.create('feat/x')).resolves.toEqual(BRANCH);
    expect(branchesRepository.create).toHaveBeenCalledWith('feat/x', 'feat-x');
  });

  it('throws BRANCH_ALREADY_EXISTS on a unique violation', async () => {
    branchesRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' }),
    );

    const error = await branchesService.create('feat/x').catch((e: ConflictException) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({ code: ErrorCode.BRANCH_ALREADY_EXISTS });
  });

  it('rethrows other errors', async () => {
    const failure = new Error('db down');
    branchesRepository.create.mockRejectedValue(failure);
    await expect(branchesService.create('feat/x')).rejects.toBe(failure);
  });
});

describe('BranchesService reads', () => {
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'findById' | 'findBySlug' | 'findActivities'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      findActivities: jest.fn(),
    };
    branchesService = new BranchesService(branchesRepository as unknown as BranchesRepository, {} as StorageService);
  });

  it('finds the branch by uuid', async () => {
    branchesRepository.findById.mockResolvedValue(BRANCH);
    await expect(branchesService.findOne(BRANCH_ID)).resolves.toBe(BRANCH);
    expect(branchesRepository.findBySlug).not.toHaveBeenCalled();
  });

  it('finds the branch by slug without querying the id', async () => {
    branchesRepository.findBySlug.mockResolvedValue(BRANCH);
    await expect(branchesService.findOne('feat-x')).resolves.toBe(BRANCH);
    expect(branchesRepository.findById).not.toHaveBeenCalled();
  });

  it('throws BRANCH_NOT_FOUND for an unknown id or slug', async () => {
    const error = await branchesService.findOne('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.BRANCH_NOT_FOUND });
  });

  it('serialises the latest analysis date and forwards the filters', async () => {
    const latestAnalysisAt = new Date('2026-10-02T10:00:00.000Z');
    branchesRepository.findActivities.mockResolvedValue({
      items: [{ id: 'br-1', name: 'feat/x', slug: 'feat-x', analysisCount: 3, latestAnalysisAt }],
      total: 1,
    });

    const ordering = [{ field: 'name' as const, order: SortOrder.DESC }];
    const page = await branchesService.findAll({ search: 'feat', limit: 10, offset: 5, ordering });

    expect(branchesRepository.findActivities).toHaveBeenCalledWith('feat', 10, 5, ordering);
    expect(page).toEqual({
      items: [{ id: 'br-1', name: 'feat/x', slug: 'feat-x', analysisCount: 3, latestAnalysisAt: latestAnalysisAt.toISOString() }],
      total: 1,
    });
  });

  it('returns a null latest analysis date for a branch without analyses', async () => {
    branchesRepository.findActivities.mockResolvedValue({
      items: [{ id: 'br-2', name: 'feat/y', slug: 'feat-y', analysisCount: 0, latestAnalysisAt: null }],
      total: 1,
    });

    const page = await branchesService.findAll({ limit: 10, offset: 0 });

    expect(page.items).toEqual([{ id: 'br-2', name: 'feat/y', slug: 'feat-y', analysisCount: 0, latestAnalysisAt: null }]);
  });
});

describe('BranchesService remove', () => {
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'findById' | 'findBySlug' | 'delete'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'remove'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = { findById: jest.fn(), findBySlug: jest.fn().mockResolvedValue(null), delete: jest.fn() };
    storageService = { remove: jest.fn() };
    branchesService = new BranchesService(
      branchesRepository as unknown as BranchesRepository,
      storageService as unknown as StorageService,
    );
  });

  it('deletes the branch found by slug and its stored log files', async () => {
    branchesRepository.findBySlug.mockResolvedValue(BRANCH);
    branchesRepository.delete.mockResolvedValue([{ path: 'a' }, { path: 'b' }]);
    storageService.remove.mockResolvedValue();

    await branchesService.remove('feat-x');

    expect(branchesRepository.delete).toHaveBeenCalledWith(BRANCH_ID);
    expect(storageService.remove).toHaveBeenCalledWith([{ path: 'a' }, { path: 'b' }]);
  });

  it('ignores file cleanup failures', async () => {
    branchesRepository.findById.mockResolvedValue(BRANCH);
    branchesRepository.delete.mockResolvedValue([{ path: 'a' }]);
    storageService.remove.mockRejectedValue(new Error('disk'));

    await expect(branchesService.remove(BRANCH_ID)).resolves.toBeUndefined();
  });

  it('throws BRANCH_NOT_FOUND without deleting', async () => {
    branchesRepository.findById.mockResolvedValue(null);

    const error = await branchesService.remove('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.BRANCH_NOT_FOUND });
    expect(branchesRepository.delete).not.toHaveBeenCalled();
  });
});
