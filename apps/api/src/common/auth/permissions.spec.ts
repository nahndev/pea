import { Permission } from '@tomato/constants';
import { toPermissions } from './permissions';

describe('toPermissions', () => {
  it('keeps known permissions only', () => {
    expect(toPermissions([Permission.BRANCH_VIEW, 'branch:removed', Permission.MANAGER_USER])).toEqual([
      Permission.BRANCH_VIEW,
      Permission.MANAGER_USER,
    ]);
  });
});
