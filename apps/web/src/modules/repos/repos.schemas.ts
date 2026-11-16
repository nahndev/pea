import { AnalysisSortField, RepoSortField } from '@tomato/constants';
import { z } from 'zod';
import { orderingParam } from '@/shared/lib/sort';

export const repoListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(255).optional().catch(undefined),
  ordering: orderingParam(RepoSortField),
});

export const repoDetailParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  ordering: orderingParam(AnalysisSortField),
});

export const createRepoSchema = z.object({
  name: z.string().trim().min(1, 'required').max(255, 'too_long'),
});

export type CreateRepoInput = z.infer<typeof createRepoSchema>;

export type RepoListParams = z.infer<typeof repoListParamsSchema>;

export type RepoDetailParams = z.infer<typeof repoDetailParamsSchema>;
