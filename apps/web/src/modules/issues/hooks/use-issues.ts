import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAnalysisProgress } from '@/modules/analyses';
import type { IssueListParams } from '../issues.schemas';
import { issuesService } from '../services/issues.service';

export const useIssues = (analysisId: string, params: IssueListParams) => {
  const { isLoaded, version } = useAnalysisProgress(analysisId);
  return useQuery({
    queryKey: ['issues', analysisId, params, version],
    queryFn: () => issuesService.list(analysisId, params),
    enabled: isLoaded,
    placeholderData: keepPreviousData,
  });
};
