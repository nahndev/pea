import type { CurrentUser } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { LoginInput } from '../auth.schemas';

export const authService = {
  async login(input: LoginInput) {
    const { data } = await apiClient.post<CurrentUser>('/sessions', input);
    return data;
  },

  async current() {
    const { data } = await apiClient.get<CurrentUser>('/sessions/current');
    return data;
  },

  async logout() {
    await apiClient.delete('/sessions/current');
  },
};
