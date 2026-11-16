import { Permission } from '@tomato/constants';

export const GROUP_FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
  invalid: 'This value is not valid.',
};

export const PERMISSION_SECTIONS: { title: string; permissions: { value: Permission; description: string }[] }[] = [
  {
    title: 'Repositories',
    permissions: [
      { value: Permission.REPO_VIEW, description: 'See repositories, analyses, issues and metric results.' },
      { value: Permission.REPO_ANALYSIS, description: 'Create repositories, run analyses and change the status of issues.' },
      { value: Permission.REPO_DELETE, description: 'Delete repositories with all their analyses.' },
    ],
  },
  {
    title: 'Settings',
    permissions: [
      { value: Permission.MANAGER_RULE, description: 'Manage rules.' },
      { value: Permission.MANAGER_CONDITION, description: 'Manage conditions.' },
      { value: Permission.MANAGER_METRIC, description: 'Manage metrics and the chart settings.' },
      { value: Permission.MANAGER_DATABASE, description: 'Manage saved database connections.' },
    ],
  },
  {
    title: 'Administration',
    permissions: [{ value: Permission.MANAGER_USER, description: 'Manage users and groups, including their permissions.' }],
  },
];
