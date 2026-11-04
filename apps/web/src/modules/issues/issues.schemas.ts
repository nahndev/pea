import { IssueSortField, IssueSubjectStatus, RuleType, Severity } from '@tomato/constants';
import { z } from 'zod';
import { orderingParam } from '@/shared/lib/sort';

export const issueListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  status: z.enum(Object.values(IssueSubjectStatus) as [IssueSubjectStatus, ...IssueSubjectStatus[]]).optional().catch(undefined),
  severity: z.enum(Object.values(Severity) as [Severity, ...Severity[]]).optional().catch(undefined),
  ruleType: z.enum(Object.values(RuleType) as [RuleType, ...RuleType[]]).optional().catch(undefined),
  ordering: orderingParam(IssueSortField),
});

export type IssueListParams = z.infer<typeof issueListParamsSchema>;
