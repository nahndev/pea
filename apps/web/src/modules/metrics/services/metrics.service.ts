import type { AnalysisSchema } from '@tomato/constants';
import type { MetricHistoryItemView, MetricResultView, MetricSummaryView, MetricTrend, MetricView, Paginated, SubjectView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import { TREND_LIMIT } from '../metrics.constants';
import type { UpdateMetricInput } from '../metrics.schemas';

export const metricsService = {
  async list(schema: AnalysisSchema) {
    const { data } = await apiClient.get<MetricView[]>('/metrics', { params: { schema } });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<MetricView>(`/metrics/${id}`);
    return data;
  },

  async listSubjects(id: string) {
    const { data } = await apiClient.get<SubjectView[]>(`/metrics/${id}/subjects`);
    return data;
  },

  async listHistory(id: string, page: number) {
    const { data } = await apiClient.get<Paginated<MetricHistoryItemView>>(`/metrics/${id}/results`, {
      params: { limit: PAGE_SIZE, offset: toOffset(page) },
    });
    return data;
  },

  async update(id: string, input: UpdateMetricInput) {
    const { data } = await apiClient.patch<MetricView>(`/metrics/${id}`, input);
    return data;
  },

  async listResults(analysisId: string, page: number) {
    const { data } = await apiClient.get<Paginated<MetricResultView>>(`/analyses/${analysisId}/metrics`, {
      params: { limit: PAGE_SIZE, offset: toOffset(page) },
    });
    return data;
  },

  async listSummaries(analysisId: string) {
    const { data } = await apiClient.get<MetricSummaryView[]>(`/analyses/${analysisId}/metrics/summaries`);
    return data;
  },

  async getTrend(branchId: string, schema: AnalysisSchema, picks: string[]) {
    const { data } = await apiClient.get<MetricTrend>(`/branches/${branchId}/metrics/trend`, {
      params: { schema, limit: TREND_LIMIT, pick: picks },
      paramsSerializer: { indexes: null },
    });
    return data;
  },
};
