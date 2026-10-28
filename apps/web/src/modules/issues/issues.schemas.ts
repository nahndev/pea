import { IssueStatus, RuleType } from '@tomato/constants';
import { z } from 'zod';

export const issueListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  status: z.enum(Object.values(IssueStatus) as [IssueStatus, ...IssueStatus[]]).optional().catch(undefined),
  ruleType: z.enum(Object.values(RuleType) as [RuleType, ...RuleType[]]).optional().catch(undefined),
});

export type IssueListParams = z.infer<typeof issueListParamsSchema>;
