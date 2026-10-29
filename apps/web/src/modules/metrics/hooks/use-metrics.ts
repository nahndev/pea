import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAnalysisProgress } from '@/modules/analyses';
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
