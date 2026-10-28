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
  let analysesRepository: jest.Mocked<Pick<AnalysesRepository, 'create' | 'findById'>>;
  let mergeRequestsService: jest.Mocked<Pick<MergeRequestsService, 'findOrCreateByIid'>>;
  let uploadService: jest.Mocked<Pick<UploadService, 'remove'>>;
  let analysesService: AnalysesService;

  beforeEach(() => {
    analysesRepository = { create: jest.fn(), findById: jest.fn() };
    mergeRequestsService = { findOrCreateByIid: jest.fn().mockResolvedValue({ id: 'mr-1', iid: 7 }) };
    uploadService = { remove: jest.fn().mockResolvedValue(undefined) };
    analysesService = new AnalysesService(
      analysesRepository as unknown as AnalysesRepository,
      mergeRequestsService as unknown as MergeRequestsService,
      uploadService as unknown as UploadService,
    );
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: BadRequestException) => e);
    return (error as BadRequestException).getResponse();
  };

  it('creates the merge request and the analysis from the uploaded files', async () => {
    const analysis = { id: 'an-1', mergeRequestId: 'mr-1', commitSha: SHA, contexts: [] };
    analysesRepository.create.mockResolvedValue(analysis as never);

    const result = await analysesService.create({ iid: 7, commitSha: SHA }, UPLOADED_FILES);

    expect(mergeRequestsService.findOrCreateByIid).toHaveBeenCalledWith(7);
    expect(analysesRepository.create).toHaveBeenCalledWith({ mergeRequestId: 'mr-1', commitSha: SHA, 
      files: [{ file: 'sql.log', path: 'p-1', type: AnalysisContextType.API_METRIC }],
    });
    expect(uploadService.remove).not.toHaveBeenCalled();
    expect(result).toBe(analysis);
  });

  it('removes the uploaded files when creating the analysis fails', async () => {
    analysesRepository.create.mockRejectedValue(new Error('db down'));

    await expect(analysesService.create({ iid: 7, commitSha: SHA }, UPLOADED_FILES)).rejects.toThrow('db down');
    expect(uploadService.remove).toHaveBeenCalledWith(UPLOADED_FILES);
  });

  it('throws when the analysis does not exist', async () => {
    analysesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(analysesService.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });
});
