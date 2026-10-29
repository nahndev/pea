import type { IssueView, Paginated } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import { toOffset } from '@/shared/lib/pagination';
import { PAGE_SIZE } from '@/shared/lib/pagination.constants';
import type { IssueListParams } from '../issues.schemas';

export const issuesService = {
  async list(analysisId: string, { page, status, severity, ruleType }: IssueListParams) {
    const { data } = await apiClient.get<Paginated<IssueView>>(`/analyses/${analysisId}/issues`, {
      params: { limit: PAGE_SIZE, offset: toOffset(page), status, severity, ruleType },
    });
    return data;
  },
};
