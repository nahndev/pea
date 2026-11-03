import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IssueSubjectStatus } from '@tomato/constants';
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

export const useUpdateIssueSubject = (issueSubjectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: IssueSubjectStatus) => issuesService.updateSubject(issueSubjectId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });
};
