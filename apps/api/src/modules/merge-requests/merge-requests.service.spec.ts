import { NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { MergeRequestsRepository } from './merge-requests.repository';
import { MergeRequestsService } from './merge-requests.service';

describe('MergeRequestsService', () => {
  let mergeRequestsRepository: jest.Mocked<Pick<MergeRequestsRepository, 'findById' | 'upsertByIid'>>;
  let mergeRequestsService: MergeRequestsService;

  beforeEach(() => {
    mergeRequestsRepository = { findById: jest.fn(), upsertByIid: jest.fn() };
    mergeRequestsService = new MergeRequestsService(mergeRequestsRepository as unknown as MergeRequestsRepository);
  });

  it('returns the merge request', async () => {
    mergeRequestsRepository.findById.mockResolvedValue({ id: 'mr-1', iid: 7 });
    await expect(mergeRequestsService.findOne('mr-1')).resolves.toEqual({ id: 'mr-1', iid: 7 });
  });

  it('throws MERGE_REQUEST_NOT_FOUND when missing', async () => {
    mergeRequestsRepository.findById.mockResolvedValue(null);
    const error = await mergeRequestsService.findOne('missing').catch((e: NotFoundException) => e);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: ErrorCode.MERGE_REQUEST_NOT_FOUND,
    });
  });

  it('finds or creates by iid through a single upsert', async () => {
    mergeRequestsRepository.upsertByIid.mockResolvedValue({ id: 'mr-1', iid: 7 });
    await mergeRequestsService.findOrCreateByIid(7);
    expect(mergeRequestsRepository.upsertByIid).toHaveBeenCalledWith(7);
  });
});
