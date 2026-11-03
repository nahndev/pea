export const SubjectType = {
  DEFAULT: 'DEFAULT',
  API: 'API',
  QUERY: 'QUERY',
  TABLE: 'TABLE',
  INDEX: 'INDEX',
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];
