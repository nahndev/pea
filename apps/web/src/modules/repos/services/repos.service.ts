import type { AnalysisCountBySchema, Repo, RepoSummary, Paginated } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import type { RepoListParams, CreateRepoInput } from '../repos.schemas';

export const reposService = {
  async list({ page, q, ordering }: RepoListParams) {
    const { data } = await apiClient.get<Paginated<RepoSummary>>('/repos', {
      params: { limit: PAGE_SIZE, offset: toOffset(page), search: q || undefined, ordering },
    });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<Repo>(`/repos/${id}`);
    return data;
  },

  async countAnalyses(id: string) {
    const { data } = await apiClient.get<AnalysisCountBySchema>(`/repos/${id}/analysis-counts`);
    return data;
  },

  async create(input: CreateRepoInput) {
    const { data } = await apiClient.post<Repo>('/repos', input);
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/repos/${id}`);
  },
};
