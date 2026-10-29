import type { MetricConditionView, MetricView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { CreateConditionInput, UpdateConditionInput } from '../conditions.schemas';

export const conditionsService = {
  async list() {
    const { data } = await apiClient.get<MetricConditionView[]>('/conditions');
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<MetricConditionView>(`/conditions/${id}`);
    return data;
  },

  async listMetrics() {
    const { data } = await apiClient.get<MetricView[]>('/metrics', { params: { isActive: true } });
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
