export const DatabaseCheckStatus = {
  PASSED: 'PASSED',
  WARNING: 'WARNING',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

export type DatabaseCheckStatus = (typeof DatabaseCheckStatus)[keyof typeof DatabaseCheckStatus];
