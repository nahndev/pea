import { Injectable } from '@nestjs/common';
import type { AnalysisContext, Metric } from '../../../generated/client';
import { IssuesService } from '../../issues/issues.service';
import { SEVERITY_BY_METRIC_TYPE } from '../metrics.constants';
import type { MetricHandler } from './metric-handler.types';

@Injectable()
export class IssueCountHandler implements MetricHandler {
  constructor(private readonly issuesService: IssuesService) {}

  async handle(metric: Metric, context: AnalysisContext, analysisResultId: string): Promise<number | null> {
    const severity = SEVERITY_BY_METRIC_TYPE.get(metric.type);
    if (!severity) return null;

    return this.issuesService.countByContext(analysisResultId, context.id, severity);
  }
}
