import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAnalysisProgress } from '@/modules/analyses';
import type { UpdateMetricInput } from '../metrics.schemas';
import { metricsService } from '../services/metrics.service';

export const useMetricResults = (analysisId: string) => {
  const { isLoaded, version } = useAnalysisProgress(analysisId);
  return useQuery({
    queryKey: ['metrics', 'results', analysisId, version],
    queryFn: () => metricsService.listResults(analysisId),
    enabled: isLoaded,
    placeholderData: keepPreviousData,
  });
};

export const useMetricTrend = (branchId: string | undefined, picks: string[]) =>
  useQuery({
    queryKey: ['metrics', 'trend', branchId, picks],
    queryFn: () => metricsService.getTrend(branchId as string, picks),
    enabled: Boolean(branchId),
    placeholderData: keepPreviousData,
  });

export const useMetrics = () => useQuery({ queryKey: ['metrics', 'list'], queryFn: () => metricsService.list() });

export const useMetric = (metricId: string) =>
  useQuery({ queryKey: ['metrics', 'detail', metricId], queryFn: () => metricsService.get(metricId) });

export const useUpdateMetric = (metricId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMetricInput) => metricsService.update(metricId, input),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['metrics', 'list'] }),
      queryClient.invalidateQueries({ queryKey: ['metrics', 'detail', metricId] }),
      queryClient.invalidateQueries({ queryKey: ['metrics', 'options'] }),
      queryClient.invalidateQueries({ queryKey: ['conditions'] }),
    ]),
  });
};
