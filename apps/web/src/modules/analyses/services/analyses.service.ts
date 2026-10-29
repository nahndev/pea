import type { AnalysisSchema } from '@tomato/constants';
import type { AnalysisDetail, AnalysisSummary, Paginated } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import { LOG_FILE_FIELD } from '../analyses.constants';
import type { CreateAnalysisInput } from '../analyses.schemas';

export const analysesService = {
  async listByBranch(branchId: string, schema: AnalysisSchema, page: number) {
    const { data } = await apiClient.get<Paginated<AnalysisSummary>>(`/branches/${branchId}/analyses`, {
      params: { schema, limit: PAGE_SIZE, offset: toOffset(page) },
    });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<AnalysisDetail>(`/analyses/${id}`);
    return data;
  },

  async create(input: CreateAnalysisInput) {
    const body = new FormData();
    body.set('branch', input.branch);
    body.set('schema', input.schema);
    if (input.mergeRequestIid) body.set('mergeRequestIid', String(input.mergeRequestIid));
    body.set(LOG_FILE_FIELD.name, input.api_metric);
    const { data } = await apiClient.post<{ id: string }>('/analyses', body);
    return data;
  },

  async rerun(id: string) {
    const { data } = await apiClient.post<{ id: string }>(`/analyses/${id}/results`);
    return data;
  },
};
