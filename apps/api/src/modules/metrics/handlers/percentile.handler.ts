import { DuckDBInstance } from '@duckdb/node-api';
import { Injectable } from '@nestjs/common';
import { AnalysisContextType } from '@tomato/constants';
import type { AnalysisContext, Metric } from '../../../generated/client';
import { StorageService } from '../../files/storage.service';
import { API_METRIC_DURATION_COLUMN } from '../../rules/rules.constants';
import { PERCENTILE_BY_METRIC_TYPE } from '../metrics.constants';
import type { MetricHandler } from './metric-handler.types';

@Injectable()
export class PercentileHandler implements MetricHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(metric: Metric, context: AnalysisContext): Promise<number | null> {
    if (context.type !== AnalysisContextType.API_METRIC) return null;

    const percentile = PERCENTILE_BY_METRIC_TYPE.get(metric.type);
    if (percentile === undefined) return null;

    return this.percentile(this.storageService.resolve(context.path), percentile);
  }

  private async percentile(path: string, percentile: number): Promise<number | null> {
    const instance = await DuckDBInstance.create(':memory:');
    const connection = await instance.connect();
    try {
      const source = `read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = {${API_METRIC_DURATION_COLUMN}: 'DOUBLE'})`;
      const reader = await connection.runAndReadAll(
        `SELECT quantile_cont(${API_METRIC_DURATION_COLUMN}, ${percentile}) AS value FROM ${source}`,
      );
      const [row] = reader.getRowObjects();
      return row?.value === null || row?.value === undefined ? null : Number(row.value);
    } finally {
      connection.closeSync();
      instance.closeSync();
    }
  }
}
