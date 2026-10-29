import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateConditionInput, UpdateConditionInput } from '../conditions.schemas';
import { conditionsService } from '../services/conditions.service';

export const useConditions = () => useQuery({ queryKey: ['conditions'], queryFn: () => conditionsService.list() });

export const useCondition = (conditionId: string) =>
  useQuery({ queryKey: ['conditions', conditionId], queryFn: () => conditionsService.get(conditionId) });

export const useUpdateCondition = (conditionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConditionInput) => conditionsService.update(conditionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conditions'] }),
  });
};

export const useQualityGates = () => useQuery({ queryKey: ['quality-gates'], queryFn: () => conditionsService.listGates() });

export const useMetricOptions = () => useQuery({ queryKey: ['metrics', 'options'], queryFn: () => conditionsService.listMetrics() });

export const useCreateCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConditionInput) => conditionsService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conditions'] }),
  });
};
