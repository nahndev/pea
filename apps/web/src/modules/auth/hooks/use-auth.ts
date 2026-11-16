import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Permission } from '@tomato/constants';
import { CURRENT_USER_QUERY_KEY } from '../auth.constants';
import type { LoginInput } from '../auth.schemas';
import { hasPermission } from '../permissions';
import { authService } from '../services/auth.service';

export const useCurrentUser = () => useQuery({ queryKey: CURRENT_USER_QUERY_KEY, queryFn: authService.current, retry: false });

/** Any of the permissions is enough */
export const useHasPermission = (permission: Permission | Permission[]) => hasPermission(useCurrentUser().data, permission);

/** Drops the data cached for the previous user */
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: authService.logout, onSettled: () => queryClient.clear() });
};
