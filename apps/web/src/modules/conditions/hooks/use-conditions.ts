import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisSchema } from '@tomato/constants';
import type { CreateConditionInput, UpdateConditionInput } from '../conditions.schemas';
import { conditionsService } from '../services/conditions.service';

export const useConditions = (schema: AnalysisSchema) =>
  useQuery({ queryKey: ['conditions', 'list', schema], queryFn: () => conditionsService.list(schema) });

export const useCondition = (conditionId: string) =>
  useQuery({ queryKey: ['conditions', conditionId], queryFn: () => conditionsService.get(conditionId) });

export const useUpdateCondition = (conditionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConditionInput) => conditionsService.update(conditionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conditions'] }),
  });
};

export const useMetricOptions = (schema: AnalysisSchema) =>
  useQuery({ queryKey: ['metrics', 'options', schema], queryFn: () => conditionsService.listMetrics(schema) });

export const useCreateCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConditionInput) => conditionsService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conditions'] }),
  });
};
