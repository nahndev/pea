import { Injectable } from '@nestjs/common';
import type { AnalysisContext, MetricResult } from '../../generated/client';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { MetricResultsRepository, type MetricResultSource } from './metric-results.repository';
import { MetricsRepository } from './metrics.repository';

@Injectable()
export class MetricsService {
  constructor(
    private readonly metricsRepository: MetricsRepository,
    private readonly metricResultsRepository: MetricResultsRepository,
    private readonly metricHandlerFactory: MetricHandlerFactory,
  ) {}

  async measure(analysisResultId: string, contexts: AnalysisContext[]): Promise<number> {
    const metrics = await this.metricsRepository.findAll();
    const items: MetricResultSource[] = [];
    for (const context of contexts) {
      for (const metric of metrics) {
        if (!this.metricHandlerFactory.supports(metric.type)) continue;
        const value = await this.metricHandlerFactory.create(metric.type).handle(metric, context);
        if (value !== null) items.push({ metricId: metric.id, analysisContextId: context.id, value });
      }
    }
    return this.metricResultsRepository.createMany(analysisResultId, items);
  }

  findResults(analysisResultId: string): Promise<MetricResult[]> {
    return this.metricResultsRepository.findByAnalysisResult(analysisResultId);
  }
}
