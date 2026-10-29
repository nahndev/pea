import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import type { MetricHandler } from './handlers/metric-handler.types';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metricsRepository: jest.Mocked<Pick<MetricsRepository, 'findAll'>>;
  let metricResultsRepository: jest.Mocked<Pick<MetricResultsRepository, 'createMany' | 'findByAnalysisResult'>>;
  let metricHandlerFactory: jest.Mocked<Pick<MetricHandlerFactory, 'supports' | 'create'>>;
  let handler: jest.Mocked<MetricHandler>;
  let metricsService: MetricsService;

  const contexts = [{ id: 'c-1' }, { id: 'c-2' }] as never[];
  const metricList = [
    { id: 'm-1', type: 'P90' },
    { id: 'm-2', type: 'UNKNOWN' },
  ];

  beforeEach(() => {
    metricsRepository = { findAll: jest.fn().mockResolvedValue(metricList) };
    metricResultsRepository = {
      createMany: jest.fn().mockImplementation((_, items: unknown[]) => items.length),
      findByAnalysisResult: jest.fn(),
    };
    handler = { handle: jest.fn().mockResolvedValue(10) };
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

  it('stores a result for every context and supported metric', async () => {
    await expect(metricsService.measure('res-1', contexts)).resolves.toBe(2);
    expect(metricResultsRepository.createMany).toHaveBeenCalledWith('res-1', [
      { metricId: 'm-1', analysisContextId: 'c-1', value: 10 },
      { metricId: 'm-1', analysisContextId: 'c-2', value: 10 },
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
    handler.handle.mockResolvedValueOnce(null).mockResolvedValueOnce(20);
    await metricsService.measure('res-1', contexts);
    expect(metricResultsRepository.createMany).toHaveBeenCalledWith('res-1', [
      { metricId: 'm-1', analysisContextId: 'c-2', value: 20 },
    ]);
  });

  it('returns the results of an analysis result', async () => {
    metricResultsRepository.findByAnalysisResult.mockResolvedValue([{ id: 'mr-1' }] as never);
    await expect(metricsService.findResults('res-1')).resolves.toEqual([{ id: 'mr-1' }]);
  });
});
