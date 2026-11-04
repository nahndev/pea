import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { BUG_LOG_GROUP_COLUMN, bugLogEvents } from '../../../files/bug-log-events';
import { queryRows } from '../../../files/duckdb-query';
import { createSubject } from '../../../subjects/subject';
import { MAX_ERROR_SUBJECTS } from '../../metrics.constants';
import type { MetricHandler, MetricMeasurement } from '../metric-handler.types';

@Injectable()
export class ErrorOccurrencesHandler implements MetricHandler {
  async handle(_metric: Metric, context: AnalysisContext): Promise<MetricMeasurement[]> {
    if (context.schema !== AnalysisSchema.BUG) return [];

    const rows = await queryRows(`
      SELECT ${BUG_LOG_GROUP_COLUMN} AS subject, count(*) AS value
      FROM ${bugLogEvents(context.logPath)}
      GROUP BY ${BUG_LOG_GROUP_COLUMN}
      ORDER BY value DESC, subject ASC
      LIMIT ${MAX_ERROR_SUBJECTS}
    `);

    return rows.map((row) => ({
      subject: createSubject(SubjectType.ERROR, String(row.subject)),
      value: Number(row.value),
    }));
  }
}
