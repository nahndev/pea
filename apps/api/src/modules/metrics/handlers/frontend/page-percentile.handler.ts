import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { queryRows } from '../../../files/duckdb-query';
import { FRONTEND_DURATION_COLUMN, FRONTEND_PAGE_COLUMN, frontendPageLoads } from '../../../files/frontend-page-loads';
import { createSubject } from '../../../subjects/subject';
import { PERCENTILE_BY_METRIC_TYPE } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

@Injectable()
export class PagePercentileHandler implements MetricHandler {
  async handle(metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema !== AnalysisSchema.FRONTEND) return [];
    const percentile = PERCENTILE_BY_METRIC_TYPE.get(metric.type);
    if (percentile === undefined) return [];

    const rows = await queryRows(`
      SELECT * FROM (
        SELECT ${FRONTEND_PAGE_COLUMN} AS subject, quantile_cont(${FRONTEND_DURATION_COLUMN}, ${percentile}) AS value
        FROM ${frontendPageLoads(context.logPath)}
        WHERE ${FRONTEND_PAGE_COLUMN} IS NOT NULL
        GROUP BY ${FRONTEND_PAGE_COLUMN}
      )
      WHERE value IS NOT NULL
      ORDER BY value DESC, subject ASC
    `);

    return rows.map((row) => ({
      subject: createSubject(SubjectType.PAGE, String(row.subject)),
      value: Number(row.value),
    }));
  }
}
