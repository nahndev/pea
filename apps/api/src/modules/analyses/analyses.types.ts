import type { AnalysisSchema } from '@tomato/constants';
import type { Prisma } from '../../generated/client';
import type { DatabaseConnection, QueryStatsSnapshot, SubjectQueryStat } from '../database-connections/database-connections.types';
import type { LogFileField } from './analyses.constants';

const LATEST_RESULT_ORDER = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies Prisma.AnalysisResultOrderByWithRelationInput[];

export const LATEST_RESULT_INCLUDE = {
  results: {
    orderBy: LATEST_RESULT_ORDER,
    take: 1,
    include: { metricResults: { select: { evaluations: { select: { status: true } } } } },
  },
} satisfies Prisma.AnalysisInclude;

export const LATEST_RESULT_ORDER_BY = LATEST_RESULT_ORDER;

export const ANALYSIS_DATA_INCLUDE = {
  apiData: true,
  databaseData: { include: { database: true } },
} satisfies Prisma.AnalysisInclude;

export type AnalysisWithData = Prisma.AnalysisGetPayload<{ include: typeof ANALYSIS_DATA_INCLUDE }>;

export type AnalysisWithLatestResult = Prisma.AnalysisGetPayload<{ include: typeof LATEST_RESULT_INCLUDE }>;

export type AnalysisDetailRecord = Prisma.AnalysisGetPayload<{
  include: typeof LATEST_RESULT_INCLUDE & typeof ANALYSIS_DATA_INCLUDE & { branch: true };
}>;

export type AnalysisTrendRecord = Prisma.AnalysisGetPayload<{
  select: {
    id: true;
    createdAt: true;
    title: true;
    results: {
      select: {
        metricResults: {
          select: {
            value: true;
            subject: { select: { uuid: true; type: true; description: true } };
            metric: { select: { id: true; type: true; unit: true; description: true } };
          };
        };
      };
    };
  };
}>;

/** Uploaded files by multipart field */
export type UploadedLogFiles = Partial<Record<LogFileField, Express.Multer.File[]>>;

export interface MetricTrendPick {
  metricId: string;
  subjectUuid: string | null;
}

export interface ApiAnalysisContext {
  schema: Exclude<AnalysisSchema, typeof AnalysisSchema.DATABASE>;
  /** Absolute path of the uploaded log: api_metric, or bug_log for `BUG` */
  logPath: string;
}

export interface DatabaseAnalysisContext {
  schema: typeof AnalysisSchema.DATABASE;
  connection: DatabaseConnection;
  /** `pg_stat_statements` is installed and preloaded */
  isPgStatStatements: boolean;
  /** Per-query counters now and at the previous run on this database, empty without `pg_stat_statements` */
  queryStats: { current: SubjectQueryStat[]; previous: QueryStatsSnapshot | null };
}

/** What rule and metric handlers read from an analysis, built once per run */
export type AnalysisContext = ApiAnalysisContext | DatabaseAnalysisContext;
