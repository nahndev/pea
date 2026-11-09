import type { AddOnManifest } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';

export const addOnsService = {
  async list() {
    const { data } = await apiClient.get<AddOnManifest[]>('/add-ons');
    return data;
  },
};
