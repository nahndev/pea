import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BranchListParams, CreateBranchInput } from '../branches.schemas';
import { branchesService } from '../services/branches.service';

export const useBranches = (params: BranchListParams) =>
  useQuery({ queryKey: ['branches', 'list', params], queryFn: () => branchesService.list(params) });

export const useBranch = (branchId: string) =>
  useQuery({ queryKey: ['branches', branchId], queryFn: () => branchesService.get(branchId) });

export const useBranchAnalysisCounts = (branchId: string) =>
  useQuery({
    queryKey: ['branches', branchId, 'analysis-counts'],
    queryFn: () => branchesService.countAnalyses(branchId),
  });

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => branchesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });
};
