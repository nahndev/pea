import type { UserView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { UserInput, UserListParams } from '../users.schemas';

export const usersService = {
  async list(params: UserListParams) {
    const { data } = await apiClient.get<UserView[]>('/users', { params });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<UserView>(`/users/${id}`);
    return data;
  },

  async create(input: UserInput) {
    const { data } = await apiClient.post<UserView>('/users', input);
    return data;
  },

  async update(id: string, input: UserInput) {
    const { data } = await apiClient.patch<UserView>(`/users/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/users/${id}`);
  },
};
