import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserInput, UserListParams } from '../users.schemas';
import { usersService } from '../services/users.service';

export const useUsers = (params: UserListParams = {}) => useQuery({ queryKey: ['users', 'list', params], queryFn: () => usersService.list(params) });

export const useUser = (userId: string) => useQuery({ queryKey: ['users', userId], queryFn: () => usersService.get(userId) });

/** Group member lists change with users */
const invalidate = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all([queryClient.invalidateQueries({ queryKey: ['users'] }), queryClient.invalidateQueries({ queryKey: ['groups'] })]);

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: UserInput) => usersService.create(input), onSuccess: () => invalidate(queryClient) });
};

export const useUpdateUser = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => usersService.update(userId, input),
    onSuccess: () => Promise.all([invalidate(queryClient), queryClient.invalidateQueries({ queryKey: ['sessions'] })]),
  });
};

export const useDeleteUser = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => usersService.remove(userId),
    onSuccess: () => queryClient.removeQueries({ queryKey: ['users', userId] }),
    onSettled: () => invalidate(queryClient),
  });
};
