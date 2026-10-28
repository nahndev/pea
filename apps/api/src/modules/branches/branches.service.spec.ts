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
