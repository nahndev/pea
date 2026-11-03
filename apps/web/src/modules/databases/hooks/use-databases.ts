import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DatabaseInput } from '../databases.schemas';
import { databasesService } from '../services/databases.service';

export const useDatabases = () => useQuery({ queryKey: ['databases', 'list'], queryFn: () => databasesService.list() });

export const useDatabase = (databaseId: string) =>
  useQuery({ queryKey: ['databases', databaseId], queryFn: () => databasesService.get(databaseId) });

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
