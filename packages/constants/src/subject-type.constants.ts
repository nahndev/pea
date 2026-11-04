export const SubjectType = {
  DEFAULT: 'DEFAULT',
  API: 'API',
  QUERY: 'QUERY',
  TABLE: 'TABLE',
  INDEX: 'INDEX',
  DATABASE: 'DATABASE',
  ROLE: 'ROLE',
  ERROR: 'ERROR',
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];
