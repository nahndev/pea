import { BadRequestException } from '@nestjs/common';
import { AnalysisContextType, ErrorCode } from '@tomato/constants';
import { StorageService } from '../files/storage.service';
import type { StoredFile } from '../files/storage.service';
import { MergeRequestsService } from '../merge-requests/merge-requests.service';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

const SHA = 'a'.repeat(40);
const multerFile = (fieldname: string, originalname: string) =>
  ({ fieldname, originalname }) as Express.Multer.File;
const FILES_BY_FIELD = {
  api_metric: [multerFile('api_metric', 'a.jsonl')],
  query: [multerFile('query', 'b.jsonl')],
};
const STORED_FILES: StoredFile[] = [
  { file: 'a.jsonl', path: 'p-1' },
  { file: 'b.jsonl', path: 'p-2' },
];

describe('AnalysesService', () => {
  let analysesRepository: jest.Mocked<Pick<AnalysesRepository, 'create' | 'findById'>>;
  let mergeRequestsService: jest.Mocked<Pick<MergeRequestsService, 'findOrCreateByIid'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'saveMany' | 'remove'>>;
  let analysesService: AnalysesService;

  beforeEach(() => {
    analysesRepository = { create: jest.fn(), findById: jest.fn() };
    mergeRequestsService = { findOrCreateByIid: jest.fn().mockResolvedValue({ id: 'mr-1', iid: 7 }) };
    storageService = {
      saveMany: jest.fn().mockResolvedValue(STORED_FILES),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    analysesService = new AnalysesService(
      analysesRepository as unknown as AnalysesRepository,
      mergeRequestsService as unknown as MergeRequestsService,
      storageService as unknown as StorageService,
    );
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: BadRequestException) => e);
    return (error as BadRequestException).getResponse();
  };

  it('creates the merge request and the analysis from the uploaded files', async () => {
    const analysis = { id: 'an-1', mergeRequestId: 'mr-1', commitSha: SHA, contexts: [] };
    analysesRepository.create.mockResolvedValue(analysis as never);

    const result = await analysesService.create({ iid: 7, commitSha: SHA }, FILES_BY_FIELD);

    expect(storageService.saveMany).toHaveBeenCalledWith([
      FILES_BY_FIELD.api_metric[0],
      FILES_BY_FIELD.query[0],
    ]);
    expect(mergeRequestsService.findOrCreateByIid).toHaveBeenCalledWith(7);
    expect(analysesRepository.create).toHaveBeenCalledWith({ mergeRequestId: 'mr-1', commitSha: SHA, 
      files: [
        { file: 'a.jsonl', path: 'p-1', type: AnalysisContextType.API_METRIC },
        { file: 'b.jsonl', path: 'p-2', type: AnalysisContextType.QUERY },
      ],
    });
    expect(storageService.remove).not.toHaveBeenCalled();
    expect(result).toBe(analysis);
  });

  it('rejects a file from an unknown field before touching the database or the disk', async () => {
    const filesByField = { other: [multerFile('other', 'c.jsonl')] };

    await expect(codeOf(analysesService.create({ iid: 7, commitSha: SHA }, filesByField))).resolves.toEqual({
      code: ErrorCode.LOG_FILE_INVALID,
    });
    expect(mergeRequestsService.findOrCreateByIid).not.toHaveBeenCalled();
    expect(storageService.saveMany).not.toHaveBeenCalled();
  });

  it('removes the stored files when creating the analysis fails', async () => {
    analysesRepository.create.mockRejectedValue(new Error('db down'));

    await expect(analysesService.create({ iid: 7, commitSha: SHA }, FILES_BY_FIELD)).rejects.toThrow('db down');
    expect(storageService.remove).toHaveBeenCalledWith(STORED_FILES);
  });

  it('throws when the analysis does not exist', async () => {
    analysesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(analysesService.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });
});
