import type { Prisma } from '../../generated/client';

const LATEST_RESULT_ORDER = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies Prisma.AnalysisResultOrderByWithRelationInput[];

export const LATEST_RESULT_INCLUDE = {
  results: {
    orderBy: LATEST_RESULT_ORDER,
    take: 1,
    include: { metricResults: { select: { evaluations: { select: { status: true } } } } },
  },
} satisfies Prisma.AnalysisInclude;

export const LATEST_RESULT_ORDER_BY = LATEST_RESULT_ORDER;

export type AnalysisWithLatestResult = Prisma.AnalysisGetPayload<{ include: typeof LATEST_RESULT_INCLUDE }>;

export type AnalysisDetailRecord = Prisma.AnalysisGetPayload<{
  include: typeof LATEST_RESULT_INCLUDE & { branch: true };
}>;

export type AnalysisTrendRecord = Prisma.AnalysisGetPayload<{
  select: {
    id: true;
    createdAt: true;
    mergeRequestIid: true;
    results: {
      select: {
        metricResults: {
          select: { value: true; subject: true; metric: { select: { id: true; type: true; unit: true; description: true } } };
        };
      };
    };
  };
}>;

export interface MetricTrendPick {
  metricId: string;
  subject: string;
}
