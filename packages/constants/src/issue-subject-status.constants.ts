export const IssueSubjectStatus = {
  TO_REVIEW: 'TO_REVIEW',
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  FIXED: 'FIXED',
} as const;

export type IssueSubjectStatus = (typeof IssueSubjectStatus)[keyof typeof IssueSubjectStatus];
