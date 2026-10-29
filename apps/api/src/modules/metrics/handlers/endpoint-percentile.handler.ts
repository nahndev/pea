import { Injectable } from '@nestjs/common';
import { SubjectType } from '@tomato/constants';
import type { Analysis, Metric } from '../../../generated/client';
import {
  API_METRIC_DURATION_COLUMN,
  API_METRIC_ENDPOINT_COLUMN,
  apiMetricRequests,
} from '../../files/api-metric-requests';
import { queryRows } from '../../files/duckdb-query';
import { StorageService } from '../../files/storage.service';
import { createMetricSubject } from '../metric-subject';
import { PERCENTILE_BY_METRIC_TYPE } from '../metrics.constants';
import type { MetricHandler, MetricMeasurement } from './metric-handler.types';

@Injectable()
export class EndpointPercentileHandler implements MetricHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(metric: Metric, analysis: Analysis): Promise<MetricMeasurement[]> {
    const percentile = PERCENTILE_BY_METRIC_TYPE.get(metric.type);
    if (percentile === undefined) return [];

    const rows = await queryRows(`
      SELECT ${API_METRIC_ENDPOINT_COLUMN} AS subject, quantile_cont(${API_METRIC_DURATION_COLUMN}, ${percentile}) AS value
      FROM ${apiMetricRequests(this.storageService.resolve(analysis.path))}
      GROUP BY ${API_METRIC_ENDPOINT_COLUMN}
      ORDER BY value DESC, subject ASC
    `);

    return rows.map((row) => ({
      subject: createMetricSubject(SubjectType.API, String(row.subject)),
      value: Number(row.value),
    }));
  }
}
