export const SubjectType = {
  DEFAULT: 'DEFAULT',
  API: 'API',
  QUERY: 'QUERY',
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];
