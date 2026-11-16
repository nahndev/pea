import type { GroupView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { GroupInput, GroupListParams } from '../groups.schemas';

export const groupsService = {
  async list(params: GroupListParams) {
    const { data } = await apiClient.get<GroupView[]>('/groups', { params });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<GroupView>(`/groups/${id}`);
    return data;
  },

  async create(input: GroupInput) {
    const { data } = await apiClient.post<GroupView>('/groups', input);
    return data;
  },

  async update(id: string, input: GroupInput) {
    const { data } = await apiClient.patch<GroupView>(`/groups/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/groups/${id}`);
  },
};
