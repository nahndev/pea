import { MetricConditionOperator, MetricEvaluationStatus } from '@tomato/constants';
import { MetricsService } from '../metrics/metrics.service';
import { MetricEvaluationsRepository } from './metric-evaluations.repository';
import { QualityGatesRepository } from './quality-gates.repository';
import { QualityGatesService } from './quality-gates.service';

describe('QualityGatesService', () => {
  let qualityGatesRepository: jest.Mocked<Pick<QualityGatesRepository, 'findAllWithConditions'>>;
  let metricEvaluationsRepository: jest.Mocked<Pick<MetricEvaluationsRepository, 'createMany'>>;
  let metricsService: jest.Mocked<Pick<MetricsService, 'findResults'>>;
  let qualityGatesService: QualityGatesService;

  const condition = (id: string, operator: string, threshold: number, metricId = 'm-1') => ({
    id,
    metricId,
    operator,
    threshold,
  });
  const gates = (...conditions: ReturnType<typeof condition>[]) => [{ id: 'g-1', conditions }];

  beforeEach(() => {
    qualityGatesRepository = { findAllWithConditions: jest.fn() };
    metricEvaluationsRepository = { createMany: jest.fn().mockImplementation((items: unknown[]) => items.length) };
    metricsService = {
      findResults: jest.fn().mockResolvedValue([
        { id: 'mr-1', metricId: 'm-1', value: 100 },
        { id: 'mr-2', metricId: 'm-1', value: 300 },
        { id: 'mr-3', metricId: 'm-2', value: 5 },
      ]),
    };
    qualityGatesService = new QualityGatesService(
      qualityGatesRepository as unknown as QualityGatesRepository,
      metricEvaluationsRepository as unknown as MetricEvaluationsRepository,
      metricsService as unknown as MetricsService,
    );
  });

  it('evaluates each condition against every result of its metric and snapshots the condition', async () => {
    qualityGatesRepository.findAllWithConditions.mockResolvedValue(
      gates(condition('c-1', MetricConditionOperator.GT, 200)) as never,
    );

    await expect(qualityGatesService.evaluate('res-1')).resolves.toBe(2);
    expect(metricsService.findResults).toHaveBeenCalledWith('res-1');
    expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([
      {
        metricResultId: 'mr-1',
        metricConditionId: 'c-1',
        status: MetricEvaluationStatus.PASSED,
        operator: MetricConditionOperator.GT,
        threshold: 200,
      },
      {
        metricResultId: 'mr-2',
        metricConditionId: 'c-1',
        status: MetricEvaluationStatus.FAILED,
        operator: MetricConditionOperator.GT,
        threshold: 200,
      },
    ]);
  });

  it.each([
    [MetricConditionOperator.GT, 100, MetricEvaluationStatus.PASSED],
    [MetricConditionOperator.GTE, 100, MetricEvaluationStatus.FAILED],
    [MetricConditionOperator.LT, 100, MetricEvaluationStatus.PASSED],
    [MetricConditionOperator.LTE, 100, MetricEvaluationStatus.FAILED],
    [MetricConditionOperator.LT, 101, MetricEvaluationStatus.FAILED],
  ])('treats a value of 100 with %s %d as %s', async (operator, threshold, status) => {
    metricsService.findResults.mockResolvedValue([{ id: 'mr-1', metricId: 'm-1', value: 100 }] as never);
    qualityGatesRepository.findAllWithConditions.mockResolvedValue(
      gates(condition('c-1', operator, threshold)) as never,
    );

    await qualityGatesService.evaluate('res-1');

    expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([expect.objectContaining({ status })]);
  });

  it('skips conditions with an unknown operator', async () => {
    qualityGatesRepository.findAllWithConditions.mockResolvedValue(gates(condition('c-1', 'EQ', 100)) as never);
    await qualityGatesService.evaluate('res-1');
    expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([]);
  });

  it('creates nothing when the metric of a condition was not measured', async () => {
    qualityGatesRepository.findAllWithConditions.mockResolvedValue(
      gates(condition('c-1', MetricConditionOperator.GT, 1, 'm-3')) as never,
    );
    await qualityGatesService.evaluate('res-1');
    expect(metricEvaluationsRepository.createMany).toHaveBeenCalledWith([]);
  });
});
