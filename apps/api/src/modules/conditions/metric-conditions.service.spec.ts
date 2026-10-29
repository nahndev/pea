import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AnalysisSchema, ErrorCode, MetricConditionOperator, MetricEvaluationStatus, MetricType, MetricUnit } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { MetricsService } from '../metrics/metrics.service';
import { MetricConditionsRepository } from './metric-conditions.repository';
import { MetricConditionsService } from './metric-conditions.service';
import { MetricEvaluationsRepository } from './metric-evaluations.repository';
import type { MetricConditionWithRelations } from './conditions.types';

describe('MetricConditionsService', () => {
  let metricConditionsRepository: jest.Mocked<
    Pick<MetricConditionsRepository, 'findAll' | 'findById' | 'findByMetric' | 'findActiveBySchema' | 'create' | 'update'>
  >;
  let metricEvaluationsRepository: jest.Mocked<Pick<MetricEvaluationsRepository, 'createMany'>>;
  let metricsService: jest.Mocked<Pick<MetricsService, 'findOne' | 'findResults'>>;
  let metricConditionsService: MetricConditionsService;

  const condition: MetricConditionWithRelations = {
    id: 'c-1',
    metricId: 'm-1',
    operator: MetricConditionOperator.GT,
    threshold: 1000,
    isActive: true,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    metric: {
      id: 'm-1',
      schema: AnalysisSchema.API,
      type: MetricType.P90,
      unit: MetricUnit.MILLISECOND,
      description: 'P90 duration',
      isActive: true,
    },
  };
  const view = {
    id: 'c-1',
    schema: AnalysisSchema.API,
    metric: { id: 'm-1', type: MetricType.P90, unit: MetricUnit.MILLISECOND, description: 'P90 duration', isActive: true },
    operator: MetricConditionOperator.GT,
    threshold: 1000,
    isActive: true,
  };

  beforeEach(() => {
    metricConditionsRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMetric: jest.fn().mockResolvedValue(null),
      findActiveBySchema: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    metricEvaluationsRepository = { createMany: jest.fn().mockResolvedValue(0) };
    metricsService = { findOne: jest.fn().mockResolvedValue({ ...view.metric, schema: AnalysisSchema.API }), findResults: jest.fn() };
    metricConditionsService = new MetricConditionsService(
      metricConditionsRepository as unknown as MetricConditionsRepository,
      metricEvaluationsRepository as unknown as MetricEvaluationsRepository,
      metricsService as unknown as MetricsService,
    );
  });

  describe('create', () => {
    const input = { metricId: 'm-1', operator: MetricConditionOperator.GT, threshold: 1000 };

    it('creates an active condition', async () => {
      metricConditionsRepository.create.mockResolvedValue(condition);

      await expect(metricConditionsService.create(input)).resolves.toEqual(view);
      expect(metricConditionsRepository.create).toHaveBeenCalledWith(input);
      expect(view.isActive).toBe(true);
    });

    it('throws METRIC_NOT_FOUND for an unknown metric', async () => {
      metricsService.findOne.mockResolvedValue(null);

      const error = await metricConditionsService.create(input).catch((e: NotFoundException) => e);

      expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.METRIC_NOT_FOUND });
    });

    it('throws METRIC_DISABLED for a disabled metric', async () => {
      metricsService.findOne.mockResolvedValue({ ...view.metric, schema: AnalysisSchema.API, isActive: false });

      const error = await metricConditionsService.create(input).catch((e: BadRequestException) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.METRIC_DISABLED });
      expect(metricConditionsRepository.create).not.toHaveBeenCalled();
    });

    it('throws METRIC_CONDITION_ALREADY_EXISTS when the metric already has a condition', async () => {
      metricConditionsRepository.findByMetric.mockResolvedValue(condition);

      const error = await metricConditionsService.create(input).catch((e: ConflictException) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({ code: ErrorCode.METRIC_CONDITION_ALREADY_EXISTS });
      expect(metricConditionsRepository.create).not.toHaveBeenCalled();
    });

    it('maps a unique violation from a concurrent request to the same conflict', async () => {
      metricConditionsRepository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' }),
      );

      const error = await metricConditionsService.create(input).catch((e: ConflictException) => e);

      expect((error as ConflictException).getResponse()).toEqual({ code: ErrorCode.METRIC_CONDITION_ALREADY_EXISTS });
    });

    it('rethrows other errors', async () => {
      const failure = new Error('db down');
      metricConditionsRepository.create.mockRejectedValue(failure);
      await expect(metricConditionsService.create(input)).rejects.toBe(failure);
    });
  });

  it('lists the conditions with their schema and metric', async () => {
    metricConditionsRepository.findAll.mockResolvedValue([condition]);
    await expect(metricConditionsService.findAll()).resolves.toEqual([view]);
  });

  it('returns one condition', async () => {
    metricConditionsRepository.findById.mockResolvedValue(condition);
    await expect(metricConditionsService.findOne('c-1')).resolves.toEqual(view);
  });

  it('throws METRIC_CONDITION_NOT_FOUND for an unknown id', async () => {
    metricConditionsRepository.findById.mockResolvedValue(null);

    const error = await metricConditionsService.findOne('missing').catch((e: NotFoundException) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.METRIC_CONDITION_NOT_FOUND });
  });

  it('updates the operator and the threshold', async () => {
    metricConditionsRepository.findById.mockResolvedValue(condition);
    metricConditionsRepository.update.mockResolvedValue({
      ...condition,
      operator: MetricConditionOperator.GTE,
      threshold: 1500,
    });

    const updated = await metricConditionsService.update('c-1', { operator: MetricConditionOperator.GTE, threshold: 1500 });

    expect(metricConditionsRepository.update).toHaveBeenCalledWith('c-1', {
      operator: MetricConditionOperator.GTE,
      threshold: 1500,
    });
    expect(updated).toMatchObject({ operator: MetricConditionOperator.GTE, threshold: 1500 });
  });

  it('disables and enables a condition', async () => {
    metricConditionsRepository.findById.mockResolvedValue(condition);
    metricConditionsRepository.update.mockResolvedValue({ ...condition, isActive: false });

    const updated = await metricConditionsService.update('c-1', { isActive: false });

    expect(metricConditionsRepository.update).toHaveBeenCalledWith('c-1', {
      operator: undefined,
      threshold: undefined,
      isActive: false,
    });
    expect(updated.isActive).toBe(false);
  });

  it('allows a threshold of zero', async () => {
    metricConditionsRepository.findById.mockResolvedValue(condition);
    metricConditionsRepository.update.mockResolvedValue({ ...condition, threshold: 0 });

    await metricConditionsService.update('c-1', { threshold: 0 });

    expect(metricConditionsRepository.update).toHaveBeenCalledWith('c-1', {
      operator: undefined,
      threshold: 0,
      isActive: undefined,
    });
  });

  it('throws METRIC_CONDITION_NOT_FOUND when updating an unknown id', async () => {
    metricConditionsRepository.findById.mockResolvedValue(null);

    await expect(metricConditionsService.update('missing', { threshold: 1 })).rejects.toBeInstanceOf(NotFoundException);
    expect(metricConditionsRepository.update).not.toHaveBeenCalled();
  });

  it('keeps the condition unchanged when nothing is sent', async () => {
    metricConditionsRepository.findById.mockResolvedValue(condition);

    await expect(metricConditionsService.update('c-1', {})).resolves.toEqual(view);
    expect(metricConditionsRepository.update).not.toHaveBeenCalled();
  });

  describe('evaluate', () => {
    const results = [
      { id: 'r-1', metricId: 'm-1', value: 1500 },
      { id: 'r-2', metricId: 'm-1', value: 500 },
      { id: 'r-3', metricId: 'm-other', value: 9999 },
    ];

    beforeEach(() => {
      metricsService.findResults.mockResolvedValue(results as never);
      metricConditionsRepository.findActiveBySchema.mockResolvedValue([condition]);
      metricEvaluationsRepository.createMany.mockResolvedValue(2);
    });

    it('evaluates only the conditions of the given schema', async () => {
      await metricConditionsService.evaluate('ar-1', AnalysisSchema.API);

      expect(metricConditionsRepository.findActiveBySchema).toHaveBeenCalledWith(AnalysisSchema.API);
    });

    it('creates a PASSED or FAILED evaluation for each result of the condition metric', async () => {
      await expect(metricConditionsService.evaluate('ar-1', AnalysisSchema.API)).resolves.toBe(2);

      expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
        {
          metricResultId: 'r-1',
          metricConditionId: 'c-1',
          status: MetricEvaluationStatus.FAILED,
          operator: MetricConditionOperator.GT,
          threshold: 1000,
        },
        {
          metricResultId: 'r-2',
          metricConditionId: 'c-1',
          status: MetricEvaluationStatus.PASSED,
          operator: MetricConditionOperator.GT,
          threshold: 1000,
        },
      ]);
    });

    it('creates nothing when the schema has no conditions', async () => {
      metricConditionsRepository.findActiveBySchema.mockResolvedValue([]);

      await metricConditionsService.evaluate('ar-1', AnalysisSchema.QUERY);

      expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([]);
    });
  });
});
