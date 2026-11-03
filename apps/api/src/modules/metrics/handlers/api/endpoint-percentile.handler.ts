import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import {
  API_METRIC_DURATION_COLUMN,
  API_METRIC_ENDPOINT_COLUMN,
  apiMetricRequests,
} from '../../../files/api-metric-requests';
import { queryRows } from '../../../files/duckdb-query';
import { createSubject } from '../../../subjects/subject';
import { PERCENTILE_BY_METRIC_TYPE } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

@Injectable()
export class EndpointPercentileHandler implements MetricHandler {
  async handle(metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema === AnalysisSchema.DATABASE) return [];
    const percentile = PERCENTILE_BY_METRIC_TYPE.get(metric.type);
    if (percentile === undefined) return [];

    const rows = await queryRows(`
      SELECT ${API_METRIC_ENDPOINT_COLUMN} AS subject, quantile_cont(${API_METRIC_DURATION_COLUMN}, ${percentile}) AS value
      FROM ${apiMetricRequests(context.logPath)}
      GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      ORDER BY value DESC, subject ASC
    `);

    return rows.map((row) => ({
      subject: createSubject(SubjectType.API, String(row.subject)),
      value: Number(row.value),
    }));
  }
}
