export const SubjectType = {
  DEFAULT: 'DEFAULT',
  API: 'API',
  QUERY: 'QUERY',
  TABLE: 'TABLE',
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];
