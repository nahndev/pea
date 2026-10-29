import { z } from 'zod';
import { DEFAULT_ANALYSIS_SCHEMA, analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';

export const branchListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(255).optional().catch(undefined),
});

export const branchDetailParamsSchema = z.object({
  schema: z.enum(analysisSchemaValues).catch(DEFAULT_ANALYSIS_SCHEMA),
  page: z.coerce.number().int().min(1).catch(1),
});

export const createBranchSchema = z.object({
  name: z.string().trim().min(1, 'required').max(255, 'too_long'),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export type BranchListParams = z.infer<typeof branchListParamsSchema>;
