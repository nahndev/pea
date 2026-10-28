export const IssueStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];
