import { Permission } from '@tomato/constants';
import { toPermissions } from './permissions';

describe('toPermissions', () => {
  it('keeps known permissions only', () => {
    expect(toPermissions([Permission.REPO_VIEW, 'repo:removed', Permission.MANAGER_USER])).toEqual([
      Permission.REPO_VIEW,
      Permission.MANAGER_USER,
    ]);
  });
});
