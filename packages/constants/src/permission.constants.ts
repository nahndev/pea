export const Permission = {
  REPO_VIEW: 'repo:view',
  REPO_ANALYSIS: 'repo:analysis',
  REPO_DELETE: 'repo:delete',
  MANAGER_RULE: 'manager:rule',
  MANAGER_CONDITION: 'manager:condition',
  MANAGER_METRIC: 'manager:metric',
  MANAGER_DATABASE: 'manager:database',
  MANAGER_USER: 'manager:user',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
