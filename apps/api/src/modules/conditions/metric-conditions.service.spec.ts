import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AnalysisSchema, ErrorCode, MetricConditionAggregate, MetricConditionOperator, MetricEvaluationStatus, MetricType, MetricUnit } from '@tomato/constants';
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
  let metricsService: jest.Mocked<Pick<MetricsService, 'findOne' | 'findResults' | 'findPassedHistory'>>;
  let metricConditionsService: MetricConditionsService;

  const condition: MetricConditionWithRelations = {
    id: 'c-1',
    metricId: 'm-1',
    operator: MetricConditionOperator.GT,
    threshold: 1000,
    aggregates: [],
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
    aggregates: [],
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
    metricsService = { findOne: jest.fn().mockResolvedValue({ ...view.metric, schema: AnalysisSchema.API }), findResults: jest.fn(), findPassedHistory: jest.fn() };
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
      expect(metricConditionsRepository.create).toHaveBeenCalledWith({ ...input, aggregates: [] });
      expect(view.isActive).toBe(true);
    });

    it('throws METRIC_NOT_FOUND for an unknown metric', async () => {
      metricsService.findOne.mockResolvedValue(null);

      const error = await metricConditionsService.create(input).catch((e: NotFoundException) => e);

      expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.METRIC_NOT_FOUND });
    });

    it('throws METRIC_DISABLED for a disabled metric', async () => {
      metricsService.findOne.mockResolvedValue({ ...view.metric, schema: AnalysisSchema.API, isActive: false, include: [], exclude: [] });

      const error = await metricConditionsService.create(input).catch((e: BadRequestException) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.METRIC_DISABLED });
      expect(metricConditionsRepository.create).not.toHaveBeenCalled();
    });

    it('creates a condition with several aggregate limits', async () => {
      const aggregates = [
        { aggregate: MetricConditionAggregate.MIN, operator: MetricConditionOperator.GT, threshold: 100 },
        { aggregate: MetricConditionAggregate.MEDIAN, operator: MetricConditionOperator.GT, threshold: 50 },
      ];
      metricConditionsRepository.create.mockResolvedValue({ ...condition, aggregates });

      await expect(metricConditionsService.create({ ...input, aggregates })).resolves.toEqual({ ...view, aggregates });
      expect(metricConditionsRepository.create).toHaveBeenCalledWith({ ...input, aggregates });
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

  it('lists the conditions of one schema', async () => {
    metricConditionsRepository.findAll.mockResolvedValue([condition]);
    await metricConditionsService.findAll({ schema: AnalysisSchema.API });
    expect(metricConditionsRepository.findAll).toHaveBeenCalledWith({ schema: AnalysisSchema.API });
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
      aggregates: undefined,
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
      aggregates: undefined,
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
      aggregates: undefined,
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
      await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API);

      expect(metricConditionsRepository.findActiveBySchema).toHaveBeenCalledWith(AnalysisSchema.API);
    });

    it('creates a PASSED or FAILED evaluation for each result of the condition metric', async () => {
      await expect(metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API)).resolves.toBe(2);

      expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
        {
          metricResultId: 'r-1',
          metricConditionId: 'c-1',
          status: MetricEvaluationStatus.FAILED,
          aggregate: MetricConditionAggregate.NONE,
          baseline: null,
          operator: MetricConditionOperator.GT,
          threshold: 1000,
        },
        {
          metricResultId: 'r-2',
          metricConditionId: 'c-1',
          status: MetricEvaluationStatus.PASSED,
          aggregate: MetricConditionAggregate.NONE,
          baseline: null,
          operator: MetricConditionOperator.GT,
          threshold: 1000,
        },
      ]);
    });

    it('creates nothing when the schema has no conditions', async () => {
      metricConditionsRepository.findActiveBySchema.mockResolvedValue([]);

      await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.QUERY);

      expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([]);
    });

    describe('with aggregate limits', () => {
      const limit = (aggregate: MetricConditionAggregate, threshold: number) => ({
        aggregate,
        operator: MetricConditionOperator.GT,
        threshold,
      });
      const withLimits = (aggregates: ReturnType<typeof limit>[]) => ({ ...condition, aggregates });
      const currentResults = [
        { id: 'r-1', metricId: 'm-1', subjectUuid: 's-1', value: 180 },
        { id: 'r-2', metricId: 'm-1', subjectUuid: 's-2', value: 400 },
      ];

      beforeEach(() => {
        metricsService.findResults.mockResolvedValue(currentResults as never);
        metricConditionsRepository.findActiveBySchema.mockResolvedValue([withLimits([limit(MetricConditionAggregate.MIN, 100)])]);
      });

      it('adds an evaluation per limit next to the plain one, using the history of the same subject', async () => {
        metricConditionsRepository.findActiveBySchema.mockResolvedValue([
          withLimits([limit(MetricConditionAggregate.MIN, 100), limit(MetricConditionAggregate.MAX, 50)]),
        ]);
        metricsService.findPassedHistory.mockResolvedValue([
          { subjectUuid: 's-1', value: 120 },
          { subjectUuid: 's-1', value: 60 },
          { subjectUuid: 's-2', value: 350 },
        ]);

        await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API);

        expect(metricsService.findPassedHistory).toHaveBeenCalledTimes(1);
        expect(metricsService.findPassedHistory).toHaveBeenCalledWith({
          analysisId: 'an-1',
          excludeAnalysisResultId: 'ar-1',
          metricId: 'm-1',
          excludeConditionId: 'c-1',
        });
        expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
          expect.objectContaining({ metricResultId: 'r-1', aggregate: 'NONE', baseline: null, status: MetricEvaluationStatus.PASSED }),
          expect.objectContaining({ metricResultId: 'r-1', aggregate: 'MIN', baseline: 60, status: MetricEvaluationStatus.FAILED }),
          expect.objectContaining({ metricResultId: 'r-1', aggregate: 'MAX', baseline: 120, status: MetricEvaluationStatus.FAILED }),
          expect.objectContaining({ metricResultId: 'r-2', aggregate: 'NONE', baseline: null, status: MetricEvaluationStatus.PASSED }),
          expect.objectContaining({ metricResultId: 'r-2', aggregate: 'MIN', baseline: 350, status: MetricEvaluationStatus.PASSED }),
          expect.objectContaining({ metricResultId: 'r-2', aggregate: 'MAX', baseline: 350, status: MetricEvaluationStatus.PASSED }),
        ]);
      });

      it.each([
        [MetricConditionAggregate.MIN, 60],
        [MetricConditionAggregate.MAX, 120],
        [MetricConditionAggregate.AVERAGE, 90],
        [MetricConditionAggregate.MEDIAN, 90],
      ])('uses the %s of the history as baseline', async (aggregate, baseline) => {
        metricConditionsRepository.findActiveBySchema.mockResolvedValue([withLimits([limit(aggregate, 100)])]);
        metricsService.findResults.mockResolvedValue([currentResults[0]] as never);
        metricsService.findPassedHistory.mockResolvedValue([
          { subjectUuid: 's-1', value: 120 },
          { subjectUuid: 's-1', value: 60 },
        ]);

        await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API);

        expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
          expect.objectContaining({ aggregate: 'NONE' }),
          expect.objectContaining({ aggregate, baseline }),
        ]);
      });

      it('takes the middle value as median of an odd history', async () => {
        metricConditionsRepository.findActiveBySchema.mockResolvedValue([withLimits([limit(MetricConditionAggregate.MEDIAN, 100)])]);
        metricsService.findResults.mockResolvedValue([currentResults[0]] as never);
        metricsService.findPassedHistory.mockResolvedValue(
          [300, 100, 200].map((value) => ({ subjectUuid: 's-1', value })),
        );

        await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API);

        expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
          expect.anything(),
          expect.objectContaining({ baseline: 200 }),
        ]);
      });

      it('skips the aggregate limits of a result without passed history', async () => {
        metricsService.findPassedHistory.mockResolvedValue([{ subjectUuid: 's-2', value: 350 }]);

        await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API);

        expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
          expect.objectContaining({ metricResultId: 'r-1', aggregate: 'NONE' }),
          expect.objectContaining({ metricResultId: 'r-2', aggregate: 'NONE' }),
          expect.objectContaining({ metricResultId: 'r-2', aggregate: 'MIN' }),
        ]);
      });

      it('does not load history for a condition without aggregate limits', async () => {
        metricConditionsRepository.findActiveBySchema.mockResolvedValue([condition]);

        await metricConditionsService.evaluate('ar-1', 'an-1', AnalysisSchema.API);

        expect(metricsService.findPassedHistory).not.toHaveBeenCalled();
      });
    });
  });
});
