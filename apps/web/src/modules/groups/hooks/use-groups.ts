import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GroupInput, GroupListParams } from '../groups.schemas';
import { groupsService } from '../services/groups.service';

export const useGroups = (params: GroupListParams = {}) =>
  useQuery({ queryKey: ['groups', 'list', params], queryFn: () => groupsService.list(params) });

export const useGroup = (groupId: string) => useQuery({ queryKey: ['groups', groupId], queryFn: () => groupsService.get(groupId) });

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupInput) => groupsService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
};

/** Also refreshes the permissions of the current user, who may be in this group */
export const useUpdateGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupInput) => groupsService.update(groupId, input),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['groups'] }), queryClient.invalidateQueries({ queryKey: ['sessions'] })]),
  });
};

export const useDeleteGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => groupsService.remove(groupId),
    onSuccess: () => queryClient.removeQueries({ queryKey: ['groups', groupId] }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['groups', 'list'] }),
  });
};
