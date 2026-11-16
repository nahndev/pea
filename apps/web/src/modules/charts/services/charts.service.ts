import type { AnalysisSchema } from '@tomato/constants';
import type { MetricView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { ChartMetricInput } from '../charts.types';

export const chartsService = {
  async listMetrics(schema: AnalysisSchema) {
    const { data } = await apiClient.get<MetricView[]>('/metrics', { params: { schema } });
    return data;
  },

  async updateMetric(id: string, input: ChartMetricInput) {
    const { data } = await apiClient.patch<MetricView>(`/metrics/${id}`, input);
    return data;
  },
};
