export const SubjectType = {
  API: 'API',
  QUERY: 'QUERY',
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];
