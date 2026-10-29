export const Severity = {
  BLOCKER: 'BLOCKER',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];
