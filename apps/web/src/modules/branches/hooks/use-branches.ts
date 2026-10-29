import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBranchInput } from '../branches.schemas';
import { branchesService } from '../services/branches.service';

export const useBranches = (page: number, search?: string) =>
  useQuery({ queryKey: ['branches', 'list', { page, search }], queryFn: () => branchesService.list({ page, search }) });

export const useBranch = (branchId: string) =>
  useQuery({ queryKey: ['branches', branchId], queryFn: () => branchesService.get(branchId) });

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => branchesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });
};
