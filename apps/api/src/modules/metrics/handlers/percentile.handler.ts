import { DuckDBInstance } from '@duckdb/node-api';
import { Injectable } from '@nestjs/common';
import type { Analysis, Metric } from '../../../generated/client';
import { API_METRIC_DURATION_COLUMN, apiMetricRequests } from '../../files/api-metric-requests';
import { StorageService } from '../../files/storage.service';
import { PERCENTILE_BY_METRIC_TYPE } from '../metrics.constants';
import type { MetricHandler, MetricMeasurement } from './metric-handler.types';

@Injectable()
export class PercentileHandler implements MetricHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(metric: Metric, analysis: Analysis): Promise<MetricMeasurement[]> {
    const percentile = PERCENTILE_BY_METRIC_TYPE.get(metric.type);
    if (percentile === undefined) return [];

    const value = await this.percentile(this.storageService.resolve(analysis.path), percentile);
    return value === null ? [] : [{ value }];
  }

  private async percentile(path: string, percentile: number): Promise<number | null> {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    try {
      const reader = await connection.runAndReadAll(
        `SELECT quantile_cont(${API_METRIC_DURATION_COLUMN}, ${percentile}) AS value FROM ${apiMetricRequests(path)}`,
      );
      const [row] = reader.getRowObjects();
      return row?.value === null || row?.value === undefined ? null : Number(row.value);
    } finally {
      connection.closeSync();
      instance.closeSync();
    }
  }
}
