import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DatabaseInput } from '../databases.schemas';
import { databasesService } from '../services/databases.service';

export const useDatabases = () => useQuery({ queryKey: ['databases', 'list'], queryFn: () => databasesService.list() });

export const useDatabase = (databaseId: string) =>
  useQuery({ queryKey: ['databases', databaseId], queryFn: () => databasesService.get(databaseId) });

/** Not cached: the input holds the password. */
export const useDatabaseInspection = (input: DatabaseInput | null) =>
  useQuery({
    queryKey: ['databases', 'inspection', input],
    queryFn: () => databasesService.inspect(input!),
    enabled: input !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const useCreateDatabase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DatabaseInput) => databasesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['databases'] }),
  });
};

export const useUpdateDatabase = (databaseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DatabaseInput) => databasesService.update(databaseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['databases'] }),
  });
};

export const useDeleteDatabase = (databaseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => databasesService.remove(databaseId),
    onSuccess: () => queryClient.removeQueries({ queryKey: ['databases', databaseId] }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['databases', 'list'] }),
  });
};
