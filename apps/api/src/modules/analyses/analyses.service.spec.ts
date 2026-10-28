import { BadRequestException } from '@nestjs/common';
import { AnalysisContextType, ErrorCode } from '@tomato/constants';
import { UploadService } from '../files/upload.service';
import type { UploadedFile } from '../files/upload.service';
import { MergeRequestsService } from '../merge-requests/merge-requests.service';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

const SHA = 'a'.repeat(40);
const UPLOADED_FILES: UploadedFile[] = [{ file: 'sql.log', path: 'p-1' }];

describe('AnalysesService', () => {
  let repository: jest.Mocked<Pick<AnalysesRepository, 'create' | 'findById'>>;
  let mergeRequests: jest.Mocked<Pick<MergeRequestsService, 'findOrCreateByIid'>>;
  let uploadService: jest.Mocked<Pick<UploadService, 'remove'>>;
  let service: AnalysesService;

  beforeEach(() => {
    repository = { create: jest.fn(), findById: jest.fn() };
    mergeRequests = { findOrCreateByIid: jest.fn().mockResolvedValue({ id: 'mr-1', iid: 7 }) };
    uploadService = { remove: jest.fn().mockResolvedValue(undefined) };
    service = new AnalysesService(
      repository as unknown as AnalysesRepository,
      mergeRequests as unknown as MergeRequestsService,
      uploadService as unknown as UploadService,
    );
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: BadRequestException) => e);
    return (error as BadRequestException).getResponse();
  };

  it('creates the merge request and the analysis from the uploaded files', async () => {
    const analysis = { id: 'an-1', mergeRequestId: 'mr-1', commitSha: SHA, contexts: [] };
    repository.create.mockResolvedValue(analysis as never);

    const result = await service.create({ iid: 7, commitSha: SHA }, UPLOADED_FILES);

    expect(mergeRequests.findOrCreateByIid).toHaveBeenCalledWith(7);
    expect(repository.create).toHaveBeenCalledWith({ mergeRequestId: 'mr-1', commitSha: SHA, 
      files: [{ file: 'sql.log', path: 'p-1', type: AnalysisContextType.API_METRIC }],
    });
    expect(uploadService.remove).not.toHaveBeenCalled();
    expect(result).toBe(analysis);
  });

  it('removes the uploaded files when creating the analysis fails', async () => {
    repository.create.mockRejectedValue(new Error('db down'));

    await expect(service.create({ iid: 7, commitSha: SHA }, UPLOADED_FILES)).rejects.toThrow('db down');
    expect(uploadService.remove).toHaveBeenCalledWith(UPLOADED_FILES);
  });

  it('throws when the analysis does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(codeOf(service.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });
});
