import { useQuery } from '@tanstack/react-query';
import { branchesService } from '../services/branches.service';

export const useBranches = (page: number, search?: string) =>
  useQuery({ queryKey: ['branches', 'list', { page, search }], queryFn: () => branchesService.list({ page, search }) });

export const useBranch = (branchId: string) =>
  useQuery({ queryKey: ['branches', branchId], queryFn: () => branchesService.get(branchId) });
