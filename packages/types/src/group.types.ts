import type { Permission } from '@tomato/constants';
import type { UserSummary } from './user.types';

export interface GroupSummary {
  id: string;
  name: string;
}

export interface GroupView extends GroupSummary {
  permissions: Permission[];
  users: UserSummary[];
  createdAt: string;
  updatedAt: string;
}
