import { BadRequestException } from '@nestjs/common';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { AnalysisContextType, AnalysisEvent, ErrorCode } from '@tomato/constants';
import { StorageService } from '../files/storage.service';
import type { StoredFile } from '../files/storage.service';
import { BranchesService } from '../branches/branches.service';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

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
  let branchesService: jest.Mocked<Pick<BranchesService, 'findOrCreateByName'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'saveMany' | 'remove'>>;
  let eventEmitter2: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let analysesService: AnalysesService;

  beforeEach(() => {
    analysesRepository = { create: jest.fn(), findById: jest.fn() };
    branchesService = { findOrCreateByName: jest.fn().mockResolvedValue({ id: 'br-1', name: 'feat/x' }) };
    storageService = {
      saveMany: jest.fn().mockResolvedValue(STORED_FILES),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter2 = { emit: jest.fn() };
    analysesService = new AnalysesService(
      analysesRepository as unknown as AnalysesRepository,
      branchesService as unknown as BranchesService,
      storageService as unknown as StorageService,
    );
    Object.assign(analysesService, { eventEmitter2 });
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: BadRequestException) => e);
    return (error as BadRequestException).getResponse();
  };

  it('creates the branch and the analysis from the uploaded files', async () => {
    const analysis = { id: 'an-1', branchId: 'br-1', contexts: [] };
    analysesRepository.create.mockResolvedValue(analysis as never);

    const result = await analysesService.create({ branch: 'feat/x', mergeRequestIid: 7 }, FILES_BY_FIELD);

    expect(storageService.saveMany).toHaveBeenCalledWith([
      FILES_BY_FIELD.api_metric[0],
      FILES_BY_FIELD.query[0],
    ]);
    expect(branchesService.findOrCreateByName).toHaveBeenCalledWith('feat/x');
    expect(analysesRepository.create).toHaveBeenCalledWith({
      branchId: 'br-1',
      mergeRequestIid: 7,
      files: [
        { file: 'a.jsonl', path: 'p-1', type: AnalysisContextType.API_METRIC },
        { file: 'b.jsonl', path: 'p-2', type: AnalysisContextType.QUERY },
      ],
    });
    expect(storageService.remove).not.toHaveBeenCalled();
    expect(eventEmitter2.emit).toHaveBeenCalledWith(AnalysisEvent.CREATED, analysis);
    expect(result).toBe(analysis);
  });

  it('rejects a file from an unknown field before touching the database or the disk', async () => {
    const filesByField = { other: [multerFile('other', 'c.jsonl')] };

    await expect(codeOf(analysesService.create({ branch: 'feat/x' }, filesByField))).resolves.toEqual({
      code: ErrorCode.LOG_FILE_INVALID,
    });
    expect(branchesService.findOrCreateByName).not.toHaveBeenCalled();
    expect(storageService.saveMany).not.toHaveBeenCalled();
    expect(eventEmitter2.emit).not.toHaveBeenCalled();
  });

  it('removes the stored files when creating the analysis fails', async () => {
    analysesRepository.create.mockRejectedValue(new Error('db down'));

    await expect(analysesService.create({ branch: 'feat/x' }, FILES_BY_FIELD)).rejects.toThrow('db down');
    expect(storageService.remove).toHaveBeenCalledWith(STORED_FILES);
    expect(eventEmitter2.emit).not.toHaveBeenCalled();
  });

  it('throws when the analysis does not exist', async () => {
    analysesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(analysesService.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });
});
