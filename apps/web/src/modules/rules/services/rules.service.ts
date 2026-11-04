import type { RuleView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { CreateRuleInput, RuleListParams, RuleUpdateInput } from '../rules.schemas';

export const rulesService = {
  async list({ schema, ordering }: RuleListParams) {
    const { data } = await apiClient.get<RuleView[]>('/rules', { params: { schema, ordering } });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<RuleView>(`/rules/${id}`);
    return data;
  },

  async create(input: CreateRuleInput) {
    const { data } = await apiClient.post<RuleView>('/rules', input);
    return data;
  },

  async update(id: string, input: RuleUpdateInput) {
    const { data } = await apiClient.patch<RuleView>(`/rules/${id}`, input);
    return data;
  },
};
