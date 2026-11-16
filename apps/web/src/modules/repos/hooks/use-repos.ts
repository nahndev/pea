import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Repo } from '@tomato/types';
import type { RepoListParams, CreateRepoInput } from '../repos.schemas';
import { reposService } from '../services/repos.service';

export const useRepos = (params: RepoListParams) =>
  useQuery({ queryKey: ['repos', 'list', params], queryFn: () => reposService.list(params) });

export const useRepo = (repoId: string) =>
  useQuery({ queryKey: ['repos', repoId], queryFn: () => reposService.get(repoId) });

export const useRepoAnalysisCounts = (repoId: string) =>
  useQuery({
    queryKey: ['repos', repoId, 'analysis-counts'],
    queryFn: () => reposService.countAnalyses(repoId),
  });

export const useCreateRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRepoInput) => reposService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repos'] }),
  });
};

/** Pages query a repo by uuid or slug, so both caches are dropped */
export const useDeleteRepo = ({ id, slug }: Repo) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reposService.remove(id),
    onSuccess: () => [id, slug].forEach((key) => queryClient.removeQueries({ queryKey: ['repos', key] })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['repos', 'list'] }),
  });
};
