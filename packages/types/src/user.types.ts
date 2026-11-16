import type { Permission } from '@tomato/constants';
import type { GroupSummary } from './group.types';

export interface UserSummary {
  id: string;
  name: string;
  username: string;
}

export interface UserView extends UserSummary {
  group: GroupSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUser extends UserSummary {
  group: GroupSummary;
  permissions: Permission[];
}
