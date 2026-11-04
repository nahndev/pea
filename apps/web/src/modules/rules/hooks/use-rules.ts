import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRuleInput, RuleListParams, RuleUpdateInput } from '../rules.schemas';
import { rulesService } from '../services/rules.service';

export const useRules = (params: RuleListParams) =>
  useQuery({ queryKey: ['rules', 'list', params], queryFn: () => rulesService.list(params) });

export const useRule = (ruleId: string) =>
  useQuery({ queryKey: ['rules', ruleId], queryFn: () => rulesService.get(ruleId) });

export const useUpdateRule = (ruleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleUpdateInput) => rulesService.update(ruleId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRuleInput) => rulesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });
};
