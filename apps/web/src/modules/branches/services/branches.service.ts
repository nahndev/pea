import type { Branch, BranchSummary, Paginated } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';

interface ListBranchesParams {
  page: number;
  search?: string;
}

export const branchesService = {
  async list({ page, search }: ListBranchesParams) {
    const { data } = await apiClient.get<Paginated<BranchSummary>>('/branches', {
      params: { limit: PAGE_SIZE, offset: toOffset(page), search: search || undefined },
    });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<Branch>(`/branches/${id}`);
    return data;
  },
};
