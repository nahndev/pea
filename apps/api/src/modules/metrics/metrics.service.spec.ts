import { NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import type { MetricHandler } from './handlers/metric-handler.types';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metricsRepository: jest.Mocked<Pick<MetricsRepository, 'findAll' | 'findById' | 'update'>>;
  let metricResultsRepository: jest.Mocked<
    Pick<MetricResultsRepository, 'createMany' | 'findByAnalysisResult' | 'findDetailedByAnalysisResult'>
  >;
  let metricHandlerFactory: jest.Mocked<Pick<MetricHandlerFactory, 'supports' | 'create'>>;
  let handler: jest.Mocked<MetricHandler>;
  let metricsService: MetricsService;

  const contexts = [{ id: 'c-1' }, { id: 'c-2' }] as never[];
  const metricList = [
    { id: 'm-1', type: 'P90' },
    { id: 'm-2', type: 'UNKNOWN' },
  ];

  beforeEach(() => {
    metricsRepository = { findAll: jest.fn().mockResolvedValue(metricList), findById: jest.fn(), update: jest.fn() };
    metricResultsRepository = {
      createMany: jest.fn().mockImplementation((_, items: unknown[]) => items.length),
      findByAnalysisResult: jest.fn(),
      findDetailedByAnalysisResult: jest.fn(),
    };
    handler = { handle: jest.fn().mockResolvedValue([{ value: 10 }]) };
    metricHandlerFactory = {
      supports: jest.fn().mockImplementation((type: string) => type === 'P90'),
      create: jest.fn().mockReturnValue(handler),
    };
    metricsService = new MetricsService(
      metricsRepository as unknown as MetricsRepository,
      metricResultsRepository as unknown as MetricResultsRepository,
      metricHandlerFactory as unknown as MetricHandlerFactory,
    );
  });

  it('only measures active metrics', async () => {
    await metricsService.measure('res-1', contexts);
    expect(metricsRepository.findAll).toHaveBeenCalledWith({ isActive: true });
  });

  it('stores a result for every context and supported metric', async () => {
    await expect(metricsService.measure('res-1', contexts)).resolves.toBe(2);
    expect(metricResultsRepository.createMany).toHaveBeenCalledWith('res-1', [
      { metricId: 'm-1', analysisContextId: 'c-1', subject: '', value: 10 },
      { metricId: 'm-1', analysisContextId: 'c-2', subject: '', value: 10 },
    ]);
  });

  it('stores one result per measurement when a handler returns several', async () => {
    handler.handle.mockResolvedValueOnce([
      { subject: 'GET /api/cart', value: 30 },
      { subject: 'POST /api/checkout', value: 20 },
    ]);
    handler.handle.mockResolvedValueOnce([]);

    await expect(metricsService.measure('res-1', contexts)).resolves.toBe(2);
    expect(metricResultsRepository.createMany).toHaveBeenCalledWith('res-1', [
      { metricId: 'm-1', analysisContextId: 'c-1', subject: 'GET /api/cart', value: 30 },
      { metricId: 'm-1', analysisContextId: 'c-1', subject: 'POST /api/checkout', value: 20 },
    ]);
  });

  it('passes the analysis result to the handler', async () => {
    await metricsService.measure('res-1', contexts);
    expect(handler.handle).toHaveBeenCalledWith(metricList[0], contexts[0], 'res-1');
  });

  it('skips metrics whose type has no handler', async () => {
    await metricsService.measure('res-1', contexts);
    expect(metricHandlerFactory.create).not.toHaveBeenCalledWith('UNKNOWN');
  });

  it('skips metrics the handler did not measure', async () => {
    handler.handle.mockResolvedValueOnce([]).mockResolvedValueOnce([{ value: 20 }]);
    await metricsService.measure('res-1', contexts);
    expect(metricResultsRepository.createMany).toHaveBeenCalledWith('res-1', [
      { metricId: 'm-1', analysisContextId: 'c-2', subject: '', value: 20 },
    ]);
  });

  it('returns the results of an analysis result', async () => {
    metricResultsRepository.findByAnalysisResult.mockResolvedValue([{ id: 'mr-1' }] as never);
    await expect(metricsService.findResults('res-1')).resolves.toEqual([{ id: 'mr-1' }]);
  });

  it('exposes the unit and the subject of each result', async () => {
    metricResultsRepository.findDetailedByAnalysisResult.mockResolvedValue([
      {
        id: 'mr-1',
        value: 3,
        subject: '',
        metric: { id: 'm-9', type: 'HIGH_ISSUE_COUNT', unit: 'COUNT', description: 'High issues' },
        analysisContext: { file: 'a.log' },
        evaluations: [],
      },
    ] as never);

    await expect(metricsService.findResultViews('res-1')).resolves.toEqual([
      {
        id: 'mr-1',
        value: 3,
        subject: '',
        metric: { id: 'm-9', type: 'HIGH_ISSUE_COUNT', unit: 'COUNT', description: 'High issues' },
        context: { file: 'a.log' },
        evaluations: [],
      },
    ]);
  });

  it('lists the metrics with their unit', async () => {
    metricsRepository.findAll.mockResolvedValue([
      { id: 'm-1', type: 'P90', unit: 'MILLISECOND', description: 'P90 duration', isActive: false, config: {} },
    ] as never);

    await expect(metricsService.findAll({ isActive: false })).resolves.toEqual([
      { id: 'm-1', type: 'P90', unit: 'MILLISECOND', description: 'P90 duration', isActive: false },
    ]);
    expect(metricsRepository.findAll).toHaveBeenCalledWith({ isActive: false });
  });

  it('returns one metric, or null when it does not exist', async () => {
    metricsRepository.findById.mockResolvedValueOnce({ id: 'm-1', type: 'P90', unit: 'MILLISECOND', description: 'd', isActive: true } as never);
    metricsRepository.findById.mockResolvedValueOnce(null);

    await expect(metricsService.findOne('m-1')).resolves.toEqual({
      id: 'm-1',
      type: 'P90',
      unit: 'MILLISECOND',
      description: 'd',
      isActive: true,
    });
    await expect(metricsService.findOne('missing')).resolves.toBeNull();
  });

  describe('update', () => {
    const row = { id: 'm-1', type: 'P90', unit: 'MILLISECOND', description: 'P90 duration', isActive: true, config: {} };

    it('updates the description and the active flag', async () => {
      metricsRepository.findById.mockResolvedValue(row as never);
      metricsRepository.update.mockResolvedValue({ ...row, description: 'New', isActive: false } as never);

      await expect(metricsService.update('m-1', { description: 'New', isActive: false })).resolves.toMatchObject({
        description: 'New',
        isActive: false,
      });
      expect(metricsRepository.update).toHaveBeenCalledWith('m-1', { description: 'New', isActive: false });
    });

    it('keeps the metric unchanged when nothing is sent', async () => {
      metricsRepository.findById.mockResolvedValue(row as never);

      await expect(metricsService.update('m-1', {})).resolves.toMatchObject({ id: 'm-1', isActive: true });
      expect(metricsRepository.update).not.toHaveBeenCalled();
    });

    it('throws METRIC_NOT_FOUND for an unknown id', async () => {
      metricsRepository.findById.mockResolvedValue(null);

      const error = await metricsService.update('missing', { isActive: false }).catch((e: NotFoundException) => e);

      expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.METRIC_NOT_FOUND });
      expect(metricsRepository.update).not.toHaveBeenCalled();
    });
  });
});
