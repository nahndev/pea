import { z } from 'zod';

export const branchListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(255).optional().catch(undefined),
});

export const createBranchSchema = z.object({
  name: z.string().trim().min(1, 'required').max(255, 'too_long'),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export type BranchListParams = z.infer<typeof branchListParamsSchema>;
