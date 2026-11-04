import { AnalysisSortField, BranchSortField } from '@tomato/constants';
import { z } from 'zod';
import { orderingParam } from '@/shared/lib/sort';

export const branchListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(255).optional().catch(undefined),
  ordering: orderingParam(BranchSortField),
});

export const branchDetailParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  ordering: orderingParam(AnalysisSortField),
});

export const createBranchSchema = z.object({
  name: z.string().trim().min(1, 'required').max(255, 'too_long'),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export type BranchListParams = z.infer<typeof branchListParamsSchema>;

export type BranchDetailParams = z.infer<typeof branchDetailParamsSchema>;
