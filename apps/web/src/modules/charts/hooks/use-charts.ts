import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisSchema } from '@tomato/constants';
import type { ChartMetricInput } from '../charts.types';
import { chartsService } from '../services/charts.service';

export const useChartMetrics = (schema: AnalysisSchema) =>
  useQuery({ queryKey: ['charts', schema], queryFn: () => chartsService.listMetrics(schema) });

export const useUpdateChartMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ChartMetricInput }) => chartsService.updateMetric(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['charts'] }),
        queryClient.invalidateQueries({ queryKey: ['metrics'] }),
      ]),
  });
};
