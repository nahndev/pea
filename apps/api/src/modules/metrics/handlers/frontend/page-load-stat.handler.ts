import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { queryRows } from '../../../files/duckdb-query';
import { frontendPageLoads } from '../../../files/frontend-page-loads';
import { FRONTEND_AGGREGATE_BY_METRIC_TYPE } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

@Injectable()
export class PageLoadStatHandler implements MetricHandler {
  async handle(metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema !== AnalysisSchema.FRONTEND) return [];
    const aggregate = FRONTEND_AGGREGATE_BY_METRIC_TYPE.get(metric.type);
    if (aggregate === undefined) return [];

    const [row] = await queryRows(`SELECT ${aggregate} AS value FROM ${frontendPageLoads(context.logPath)}`);
    return row?.value === null || row?.value === undefined ? [] : [{ value: Number(row.value) }];
  }
}
