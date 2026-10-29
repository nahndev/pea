import type { MetricResultView, MetricTrend } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { TREND_LIMIT } from '../metrics.constants';

export const metricsService = {
  async listResults(analysisId: string) {
    const { data } = await apiClient.get<MetricResultView[]>(`/analyses/${analysisId}/metrics`);
    return data;
  },

  async getTrend(branchId: string, picks: string[]) {
    const { data } = await apiClient.get<MetricTrend>(`/branches/${branchId}/metrics/trend`, {
      params: { limit: TREND_LIMIT, pick: picks },
      paramsSerializer: { indexes: null },
    });
    return data;
  },
};
