import { ConflictException, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { BranchesRepository } from './branches.repository';
import { BranchesService } from './branches.service';

describe('BranchesService', () => {
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'upsertByName'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = { upsertByName: jest.fn() };
    branchesService = new BranchesService(branchesRepository as unknown as BranchesRepository);
  });

  it('finds or creates by name through a single upsert', async () => {
    branchesRepository.upsertByName.mockResolvedValue({ id: 'br-1', name: 'feat/x' });
    await expect(branchesService.findOrCreateByName('feat/x')).resolves.toEqual({ id: 'br-1', name: 'feat/x' });
    expect(branchesRepository.upsertByName).toHaveBeenCalledWith('feat/x');
  });
});

describe('BranchesService create', () => {
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'create'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = { create: jest.fn() };
    branchesService = new BranchesService(branchesRepository as unknown as BranchesRepository);
  });

  it('creates the branch', async () => {
    branchesRepository.create.mockResolvedValue({ id: 'br-1', name: 'feat/x' });
    await expect(branchesService.create('feat/x')).resolves.toEqual({ id: 'br-1', name: 'feat/x' });
    expect(branchesRepository.create).toHaveBeenCalledWith('feat/x');
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
  let branchesRepository: jest.Mocked<Pick<BranchesRepository, 'findById' | 'findActivities'>>;
  let branchesService: BranchesService;

  beforeEach(() => {
    branchesRepository = { findById: jest.fn(), findActivities: jest.fn() };
    branchesService = new BranchesService(branchesRepository as unknown as BranchesRepository);
  });

  it('throws BRANCH_NOT_FOUND for an unknown id', async () => {
    branchesRepository.findById.mockResolvedValue(null);

    const error = await branchesService.findOne('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.BRANCH_NOT_FOUND });
  });

  it('serialises the latest analysis date and forwards the filters', async () => {
    const latestAnalysisAt = new Date('2026-10-02T10:00:00.000Z');
    branchesRepository.findActivities.mockResolvedValue({
      items: [{ id: 'br-1', name: 'feat/x', analysisCount: 3, latestAnalysisAt }],
      total: 1,
    });

    const page = await branchesService.findAll({ search: 'feat', limit: 10, offset: 5 });

    expect(branchesRepository.findActivities).toHaveBeenCalledWith('feat', 10, 5);
    expect(page).toEqual({
      items: [{ id: 'br-1', name: 'feat/x', analysisCount: 3, latestAnalysisAt: latestAnalysisAt.toISOString() }],
      total: 1,
    });
  });

  it('returns a null latest analysis date for a branch without analyses', async () => {
    branchesRepository.findActivities.mockResolvedValue({
      items: [{ id: 'br-2', name: 'feat/y', analysisCount: 0, latestAnalysisAt: null }],
      total: 1,
    });

    const page = await branchesService.findAll({ limit: 10, offset: 0 });

    expect(page.items).toEqual([{ id: 'br-2', name: 'feat/y', analysisCount: 0, latestAnalysisAt: null }]);
  });
});
