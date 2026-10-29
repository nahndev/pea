import type { AnalysisSchema } from '@tomato/constants';
import type { MetricResultView, MetricTrend, MetricView, SubjectView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
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

  async update(id: string, input: UpdateMetricInput) {
    const { data } = await apiClient.patch<MetricView>(`/metrics/${id}`, input);
    return data;
  },

  async listResults(analysisId: string) {
    const { data } = await apiClient.get<MetricResultView[]>(`/analyses/${analysisId}/metrics`);
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
