import { NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { MergeRequestsRepository } from './merge-requests.repository';
import { MergeRequestsService } from './merge-requests.service';

describe('MergeRequestsService', () => {
  let repository: jest.Mocked<Pick<MergeRequestsRepository, 'findById' | 'upsertByIid'>>;
  let service: MergeRequestsService;

  beforeEach(() => {
    repository = { findById: jest.fn(), upsertByIid: jest.fn() };
    service = new MergeRequestsService(repository as unknown as MergeRequestsRepository);
  });

  it('returns the merge request', async () => {
    repository.findById.mockResolvedValue({ id: 'mr-1', iid: 7 });
    await expect(service.findOne('mr-1')).resolves.toEqual({ id: 'mr-1', iid: 7 });
  });

  it('throws MERGE_REQUEST_NOT_FOUND when missing', async () => {
    repository.findById.mockResolvedValue(null);
    const error = await service.findOne('missing').catch((e: NotFoundException) => e);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: ErrorCode.MERGE_REQUEST_NOT_FOUND,
    });
  });

  it('finds or creates by iid through a single upsert', async () => {
    repository.upsertByIid.mockResolvedValue({ id: 'mr-1', iid: 7 });
    await service.findOrCreateByIid(7);
    expect(repository.upsertByIid).toHaveBeenCalledWith(7);
  });
});
