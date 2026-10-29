import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { AnalysisEvent, AnalysisSchema, ErrorCode } from '@tomato/constants';
import { StorageService } from '../files/storage.service';
import type { StoredFile } from '../files/storage.service';
import { BranchesService } from '../branches/branches.service';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

const UPLOAD = { fieldname: 'api_metric', originalname: 'a.jsonl' } as Express.Multer.File;
const STORED_FILE: StoredFile = { file: 'a.jsonl', path: 'p-1' };

describe('AnalysesService', () => {
  let analysesRepository: jest.Mocked<Pick<AnalysesRepository, 'create' | 'findById'>>;
  let branchesService: jest.Mocked<Pick<BranchesService, 'findOrCreateByName'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'save' | 'remove'>>;
  let eventEmitter2: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let analysesService: AnalysesService;

  beforeEach(() => {
    analysesRepository = { create: jest.fn(), findById: jest.fn() };
    branchesService = { findOrCreateByName: jest.fn().mockResolvedValue({ id: 'br-1', name: 'feat/x' }) };
    storageService = {
      save: jest.fn().mockResolvedValue(STORED_FILE),
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
    const analysis = { id: 'an-1', branchId: 'br-1', ...STORED_FILE };
    analysesRepository.create.mockResolvedValue(analysis as never);

    const result = await analysesService.create({ branch: 'feat/x', schema: AnalysisSchema.API, mergeRequestIid: 7 }, UPLOAD);

    expect(storageService.save).toHaveBeenCalledWith(UPLOAD);
    expect(branchesService.findOrCreateByName).toHaveBeenCalledWith('feat/x');
    expect(analysesRepository.create).toHaveBeenCalledWith({
      branchId: 'br-1',
      schema: AnalysisSchema.API,
      mergeRequestIid: 7,
      file: STORED_FILE,
    });
    expect(storageService.remove).not.toHaveBeenCalled();
    expect(eventEmitter2.emit).toHaveBeenCalledWith(AnalysisEvent.CREATED, analysis);
    expect(result).toBe(analysis);
  });

  it('rejects a missing file before touching the database or the disk', async () => {
    await expect(codeOf(analysesService.create({ branch: 'feat/x', schema: AnalysisSchema.API }))).resolves.toEqual({
      code: ErrorCode.LOG_FILE_REQUIRED,
    });
    expect(branchesService.findOrCreateByName).not.toHaveBeenCalled();
    expect(storageService.save).not.toHaveBeenCalled();
    expect(eventEmitter2.emit).not.toHaveBeenCalled();
  });

  it('removes the stored files when creating the analysis fails', async () => {
    analysesRepository.create.mockRejectedValue(new Error('db down'));

    await expect(analysesService.create({ branch: 'feat/x', schema: AnalysisSchema.API }, UPLOAD)).rejects.toThrow('db down');
    expect(storageService.remove).toHaveBeenCalledWith([STORED_FILE]);
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
      items: [{ id: 'an-1', schema: 'API', mergeRequestIid: 3, createdAt, results: [result(evaluationStatuses)] }] as never,
      total: 1,
    });

    const page = await analysesService.findByBranch('br-1', { schema: AnalysisSchema.API, limit: 20, offset: 0 });

    expect(page.total).toBe(1);
    expect(page.items[0]).toEqual({
      id: 'an-1',
      schema: 'API',
      mergeRequestIid: 3,
      createdAt: createdAt.toISOString(),
      latestResult: { id: 'res-1', status: 'COMPLETED', issueCount: 2, gateStatus: expected },
    });
  });

  it('returns a null latest result when the analysis has not been evaluated', async () => {
    analysesRepository.findPageByBranch.mockResolvedValue({
      items: [{ id: 'an-1', schema: 'API', mergeRequestIid: null, createdAt, results: [] }] as never,
      total: 1,
    });

    const page = await analysesService.findByBranch('br-1', { schema: AnalysisSchema.API, limit: 20, offset: 0 });

    expect(page.items[0].latestResult).toBeNull();
  });

  it('rejects listing analyses of an unknown branch', async () => {
    branchesService.findOne.mockRejectedValue(new NotFoundException({ code: ErrorCode.BRANCH_NOT_FOUND }));

    await expect(analysesService.findByBranch('missing', { schema: AnalysisSchema.API, limit: 20, offset: 0 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(analysesRepository.findPageByBranch).not.toHaveBeenCalled();
  });

  describe('getMetricTrend', () => {
    const metric = (id: string, type: string) => ({
      id,
      type,
      unit: type.endsWith('COUNT') ? 'COUNT' : 'MILLISECOND',
      description: type,
    });
    const subject = (uuid: string, description: string) => ({ uuid, type: 'API', description });
    const result = (rows: [string, string, ReturnType<typeof subject> | null, number][]) => ({
      metricResults: rows.map(([id, type, subject, value]) => ({ value, subject, metric: metric(id, type) })),
    });

    it('keys values by metric and subject and orders the trend oldest first', async () => {
      analysesRepository.findRecentByBranch.mockResolvedValue([
        { id: 'an-2', createdAt, mergeRequestIid: null, results: [result([['m-90', 'P90', null, 400]])] },
        {
          id: 'an-1',
          createdAt,
          mergeRequestIid: 5,
          results: [result([['m-90', 'P90', null, 200], ['m-50', 'P50', null, 50]])],
        },
      ] as never);

      const trend = await analysesService.getMetricTrend('br-1', AnalysisSchema.API, 20);

      expect(analysesRepository.findRecentByBranch).toHaveBeenCalledWith('br-1', AnalysisSchema.API, 20, []);
      expect(trend.points.map(({ analysisId }) => analysisId)).toEqual(['an-1', 'an-2']);
      expect(trend.points[0].values).toEqual({ 'm-90:': 200, 'm-50:': 50 });
      expect(trend.points[1].values).toEqual({ 'm-90:': 400 });
      expect(trend.series.map(({ key }) => key)).toEqual(['m-50:', 'm-90:']);
      expect(trend.series[0].metric).toEqual({ id: 'm-50', type: 'P50', unit: 'MILLISECOND', description: 'P50' });
    });

    it('keeps endpoint results apart and orders the series like the picks', async () => {
      const m1 = '11111111-1111-1111-1111-111111111111';
      const m2 = '22222222-2222-2222-2222-222222222222';
      const cart = subject('aaaaaaaa-aaaa-5aaa-8aaa-aaaaaaaaaaaa', 'GET /api/cart');
      const orders = subject('bbbbbbbb-bbbb-5bbb-8bbb-bbbbbbbbbbbb', 'GET /api/orders');
      analysesRepository.findRecentByBranch.mockResolvedValue([
        {
          id: 'an-1',
          createdAt,
          mergeRequestIid: null,
          results: [result([[m1, 'ENDPOINT_P95', cart, 900], [m2, 'P50', null, 10], [m1, 'ENDPOINT_P95', orders, 300]])],
        },
      ] as never);

      const picks = [`${m2}:`, `${m1}:${cart.uuid}`, `${m1}:${orders.uuid}`];
      const trend = await analysesService.getMetricTrend('br-1', AnalysisSchema.API, 20, picks);

      expect(analysesRepository.findRecentByBranch).toHaveBeenCalledWith('br-1', AnalysisSchema.API, 20, [
        { metricId: m2, subjectUuid: null },
        { metricId: m1, subjectUuid: cart.uuid },
        { metricId: m1, subjectUuid: orders.uuid },
      ]);
      expect(trend.series.map(({ key }) => key)).toEqual(picks);
      expect(trend.series[1].subject).toEqual(cart);
      expect(trend.series[0].subject).toBeNull();
      expect(trend.points[0].values[`${m1}:${cart.uuid}`]).toBe(900);
    });
  });
});
