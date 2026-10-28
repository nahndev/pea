import { NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
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
});
