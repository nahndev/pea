import type { AnalysisContextType, IssueStatus, RuleType } from '@tomato/constants';

export interface IssueView {
  id: string;
  status: IssueStatus;
  description: string | null;
  createdAt: string;
  rule: { type: RuleType; description: string };
  context: { file: string; type: AnalysisContextType };
}
