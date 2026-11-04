import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { bugLogEvents } from '../../../files/bug-log-events';
import { queryRows } from '../../../files/duckdb-query';
import { BUG_LOG_AGGREGATE_BY_METRIC_TYPE } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

@Injectable()
export class ErrorCountHandler implements MetricHandler {
  async handle(metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema !== AnalysisSchema.BUG) return [];
    const aggregate = BUG_LOG_AGGREGATE_BY_METRIC_TYPE.get(metric.type);
    if (aggregate === undefined) return [];

    const [row] = await queryRows(`SELECT ${aggregate} AS value FROM ${bugLogEvents(context.logPath)}`);
    return [{ value: Number(row?.value ?? 0) }];
  }
}
