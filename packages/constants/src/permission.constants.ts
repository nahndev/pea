export const Permission = {
  BRANCH_VIEW: 'branch:view',
  BRANCH_ANALYSIS: 'branch:analysis',
  BRANCH_DELETE: 'branch:delete',
  MANAGER_RULE: 'manager:rule',
  MANAGER_CONDITION: 'manager:condition',
  MANAGER_METRIC: 'manager:metric',
  MANAGER_DATABASE: 'manager:database',
  MANAGER_USER: 'manager:user',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
