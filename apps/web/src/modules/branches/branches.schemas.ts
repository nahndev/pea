import { z } from 'zod';

export const branchListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(255).optional().catch(undefined),
});

export type BranchListParams = z.infer<typeof branchListParamsSchema>;
