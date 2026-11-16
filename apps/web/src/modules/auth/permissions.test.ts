import { Permission } from '@tomato/constants';
import type { CurrentUser } from '@tomato/types';
import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';

const viewer: CurrentUser = { id: 'u', name: 'Ada', username: 'ada', group: { id: 'g', name: 'Viewers' }, permissions: [Permission.REPO_VIEW] };

describe('hasPermission', () => {
  it('checks one permission', () => {
    expect(hasPermission(viewer, Permission.REPO_VIEW)).toBe(true);
    expect(hasPermission(viewer, Permission.REPO_DELETE)).toBe(false);
  });

  it('passes with any of several permissions', () => {
    expect(hasPermission(viewer, [Permission.MANAGER_RULE, Permission.REPO_VIEW])).toBe(true);
    expect(hasPermission(viewer, [])).toBe(false);
  });

  it('denies without a user', () => {
    expect(hasPermission(undefined, Permission.REPO_VIEW)).toBe(false);
  });
});
