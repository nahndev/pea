import { BadRequestException, NotFoundException } from '@nestjs/common';
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

describe('AnalysesService reads', () => {
  let analysesRepository: jest.Mocked<
    Pick<AnalysesRepository, 'findDetailById' | 'findPageByBranch' | 'findRecentByBranch'>
  >;
  let branchesService: jest.Mocked<Pick<BranchesService, 'findOne'>>;
  let analysesService: AnalysesService;

  const createdAt = new Date('2026-10-01T00:00:00.000Z');
  const result = (evaluationStatuses: string[]) => ({
    id: 'res-1',
    status: 'COMPLETED',
    issueCount: 2,
    metricResults: [{ evaluations: evaluationStatuses.map((evaluationStatus) => ({ status: evaluationStatus })) }],
  });

  beforeEach(() => {
    analysesRepository = { findDetailById: jest.fn(), findPageByBranch: jest.fn(), findRecentByBranch: jest.fn() };
    branchesService = { findOne: jest.fn().mockResolvedValue({ id: 'br-1', name: 'feat/x' }) };
    analysesService = new AnalysesService(
      analysesRepository as unknown as AnalysesRepository,
      branchesService as unknown as BranchesService,
      {} as StorageService,
    );
  });

  it('throws ANALYSIS_NOT_FOUND when the analysis does not exist', async () => {
    analysesRepository.findDetailById.mockResolvedValue(null);

    const error = await analysesService.findDetail('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.ANALYSIS_NOT_FOUND });
  });

  it.each([
    [[], null],
    [['PASSED', 'PASSED'], 'PASSED'],
    [['PASSED', 'FAILED'], 'FAILED'],
  ])('derives the gate status from evaluations %j as %s', async (evaluationStatuses, expected) => {
    analysesRepository.findPageByBranch.mockResolvedValue({
      items: [{ id: 'an-1', mergeRequestIid: 3, createdAt, results: [result(evaluationStatuses)] }] as never,
      total: 1,
    });

    const page = await analysesService.findByBranch('br-1', { limit: 20, offset: 0 });

    expect(page.total).toBe(1);
    expect(page.items[0]).toEqual({
      id: 'an-1',
      mergeRequestIid: 3,
      createdAt: createdAt.toISOString(),
      latestResult: { id: 'res-1', status: 'COMPLETED', issueCount: 2, gateStatus: expected },
    });
  });

  it('returns a null latest result when the analysis has not been evaluated', async () => {
    analysesRepository.findPageByBranch.mockResolvedValue({
      items: [{ id: 'an-1', mergeRequestIid: null, createdAt, results: [] }] as never,
      total: 1,
    });

    const page = await analysesService.findByBranch('br-1', { limit: 20, offset: 0 });

    expect(page.items[0].latestResult).toBeNull();
  });

  it('rejects listing analyses of an unknown branch', async () => {
    branchesService.findOne.mockRejectedValue(new NotFoundException({ code: ErrorCode.BRANCH_NOT_FOUND }));

    await expect(analysesService.findByBranch('missing', { limit: 20, offset: 0 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(analysesRepository.findPageByBranch).not.toHaveBeenCalled();
  });

  it('averages metric values per type over contexts and orders the trend oldest first', async () => {
    const metricResults = (values: [string, number][]) => ({
      metricResults: values.map(([type, value]) => ({ value, metric: { type } })),
    });
    analysesRepository.findRecentByBranch.mockResolvedValue([
      { id: 'an-2', createdAt, mergeRequestIid: null, results: [metricResults([['P90', 400]])] },
      {
        id: 'an-1',
        createdAt,
        mergeRequestIid: 5,
        results: [metricResults([['P90', 100], ['P90', 300], ['P50', 50]])],
      },
    ] as never);

    const trend = await analysesService.getMetricTrend('br-1', 20);

    expect(trend.map(({ analysisId }) => analysisId)).toEqual(['an-1', 'an-2']);
    expect(trend[0].values).toEqual({ P90: 200, P50: 50 });
    expect(trend[1].values).toEqual({ P90: 400 });
  });
});
