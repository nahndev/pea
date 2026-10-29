import type { AnalysisSchema } from '@tomato/constants';
import type { MetricConditionView, MetricView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { CreateConditionInput, UpdateConditionInput } from '../conditions.schemas';

export const conditionsService = {
  async list(schema: AnalysisSchema) {
    const { data } = await apiClient.get<MetricConditionView[]>('/conditions', { params: { schema } });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<MetricConditionView>(`/conditions/${id}`);
    return data;
  },

  async listMetrics(schema: AnalysisSchema) {
    const { data } = await apiClient.get<MetricView[]>('/metrics', { params: { isActive: true, schema } });
    return data;
  },

  async create(input: CreateConditionInput) {
    const { data } = await apiClient.post<MetricConditionView>('/conditions', input);
    return data;
  },

  async update(id: string, input: UpdateConditionInput) {
    const { data } = await apiClient.patch<MetricConditionView>(`/conditions/${id}`, input);
    return data;
  },
};
