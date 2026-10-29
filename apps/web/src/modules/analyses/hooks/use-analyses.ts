import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnalysisResultStatus } from '@tomato/constants';
import type { AnalysisDetail } from '@tomato/types';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../analyses.constants';
import type { CreateAnalysisInput } from '../analyses.schemas';
import { analysesService } from '../services/analyses.service';

const isRunning = (analysis: AnalysisDetail | undefined) =>
  analysis !== undefined &&
  (!analysis.latestResult || analysis.latestResult.status === AnalysisResultStatus.RUNNING) &&
  Date.now() - new Date(analysis.createdAt).getTime() < POLL_TIMEOUT_MS;

export const useBranchAnalyses = (branchId: string, page: number) =>
  useQuery({ queryKey: ['analyses', 'branch', branchId, { page }], queryFn: () => analysesService.listByBranch(branchId, page) });

export const useAnalysis = (analysisId: string) =>
  useQuery({
    queryKey: ['analyses', analysisId],
    queryFn: () => analysesService.get(analysisId),
    refetchInterval: ({ state }) => (isRunning(state.data) ? POLL_INTERVAL_MS : false),
  });

export const useAnalysisRunning = (analysisId: string) => isRunning(useAnalysis(analysisId).data);

export function useAnalysisProgress(analysisId: string) {
  const { data } = useAnalysis(analysisId);
  return {
    isLoaded: data !== undefined,
    version: `${data?.latestResult?.id ?? 'none'}:${data?.latestResult?.status ?? ''}`,
  };
}

export const useCreateAnalysis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnalysisInput) => analysesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });
};

export const useRerunAnalysis = (analysisId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analysesService.rerun(analysisId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analyses'] }),
  });
};
