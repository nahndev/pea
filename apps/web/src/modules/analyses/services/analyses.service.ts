import { AnalysisSchema } from '@tomato/constants';
import type { AnalysisDetail, AnalysisSummary, Paginated } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import { DatabaseConnectionMode, LOG_FILE_FIELD } from '../analyses.constants';
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
    body.set('title', input.title);
    if (input.schema !== AnalysisSchema.DATABASE) {
      body.set(LOG_FILE_FIELD.name, input.api_metric);
    } else if (input.connectionMode === DatabaseConnectionMode.URL) {
      body.set('connectionString', input.connectionString);
    } else {
      body.set('host', input.host);
      if (input.port) body.set('port', String(input.port));
      body.set('database', input.database);
      body.set('user', input.user);
      if (input.password) body.set('password', input.password);
    }
    const { data } = await apiClient.post<{ id: string }>('/analyses', body);
    return data;
  },

  async rerun(id: string) {
    const { data } = await apiClient.post<{ id: string }>(`/analyses/${id}/results`);
    return data;
  },
};
