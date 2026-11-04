import type { AnalysisCountBySchema, Branch, BranchSummary, Paginated } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import type { BranchListParams, CreateBranchInput } from '../branches.schemas';

export const branchesService = {
  async list({ page, q, ordering }: BranchListParams) {
    const { data } = await apiClient.get<Paginated<BranchSummary>>('/branches', {
      params: { limit: PAGE_SIZE, offset: toOffset(page), search: q || undefined, ordering },
    });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<Branch>(`/branches/${id}`);
    return data;
  },

  async countAnalyses(id: string) {
    const { data } = await apiClient.get<AnalysisCountBySchema>(`/branches/${id}/analysis-counts`);
    return data;
  },

  async create(input: CreateBranchInput) {
    const { data } = await apiClient.post<Branch>('/branches', input);
    return data;
  },
};
