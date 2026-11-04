import type { AnalysisSchema } from '@tomato/constants';
import type { MetricHistoryItemView, MetricResultFilterOptions, MetricResultView, MetricSummaryView, MetricTrend, MetricView, Paginated, SubjectView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import { TREND_LIMIT } from '../metrics.constants';
import type { MetricListParams, MetricPageParams, MetricResultListParams, UpdateMetricInput } from '../metrics.schemas';

export const metricsService = {
  async list({ schema, ordering }: MetricListParams) {
    const { data } = await apiClient.get<MetricView[]>('/metrics', { params: { schema, ordering } });
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

  async listHistory(id: string, { page, ordering }: MetricPageParams) {
    const { data } = await apiClient.get<Paginated<MetricHistoryItemView>>(`/metrics/${id}/results`, {
      params: { limit: PAGE_SIZE, offset: toOffset(page), ordering },
    });
    return data;
  },

  async update(id: string, input: UpdateMetricInput) {
    const { data } = await apiClient.patch<MetricView>(`/metrics/${id}`, input);
    return data;
  },

  async listResults(analysisId: string, { page, metricType, subjectUuid, ordering }: MetricResultListParams) {
    const { data } = await apiClient.get<Paginated<MetricResultView>>(`/analyses/${analysisId}/metrics`, {
      params: { limit: PAGE_SIZE, offset: toOffset(page), metricType, subjectUuid, ordering },
    });
    return data;
  },

  async listResultFilters(analysisId: string) {
    const { data } = await apiClient.get<MetricResultFilterOptions>(`/analyses/${analysisId}/metrics/filters`);
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
