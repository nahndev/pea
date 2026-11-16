import { ConflictException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { verifyPassword } from '../../common/crypto/password';
import type { AuthService } from '../auth/auth.service';
import type { GroupsService } from '../groups/groups.service';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import type { UserWithGroup } from './users.types';

describe('UsersService', () => {
  const createdAt = new Date('2026-11-01T00:00:00.000Z');
  const record: UserWithGroup = {
    id: 'user-1',
    name: 'Ada',
    username: 'ada',
    passwordHash: 'salt:hash',
    groupId: 'group-1',
    createdAt,
    updatedAt: createdAt,
    group: { id: 'group-1', name: 'Analysts' },
  };
  const input = { name: 'Ada', username: 'ada', password: 'correct horse', groupId: 'group-1' };
  const responseOf = async (promise: Promise<unknown>) => ((await promise.catch((e: Error) => e)) as ConflictException).getResponse();

  let usersRepository: jest.Mocked<Pick<UsersRepository, 'findAll' | 'findById' | 'create' | 'update' | 'delete'>>;
  let groupsService: { assertExists: jest.Mock };
  let authService: { revokeUserSessions: jest.Mock };
  let usersService: UsersService;

  beforeEach(() => {
    usersRepository = {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(record),
      create: jest.fn().mockResolvedValue(record),
      update: jest.fn().mockResolvedValue(record),
      delete: jest.fn(),
    };
    groupsService = { assertExists: jest.fn() };
    authService = { revokeUserSessions: jest.fn() };
    usersService = new UsersService(usersRepository as unknown as UsersRepository, groupsService as unknown as GroupsService, authService as unknown as AuthService);
  });

  it('stores a hash of the password and never returns it', async () => {
    const view = await usersService.create(input);

    const { passwordHash, ...data } = usersRepository.create.mock.calls[0][0];
    expect(data).toEqual({ name: 'Ada', username: 'ada', groupId: 'group-1' });
    await expect(verifyPassword('correct horse', passwordHash)).resolves.toBe(true);
    expect(groupsService.assertExists).toHaveBeenCalledWith('group-1');
    expect(view).toEqual({ id: 'user-1', name: 'Ada', username: 'ada', group: { id: 'group-1', name: 'Analysts' }, createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString() });
  });

  it('maps a duplicated username to USER_ALREADY_EXISTS', async () => {
    usersRepository.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('failed', { code: 'P2002', clientVersion: 'test' }));

    await expect(responseOf(usersService.create(input))).resolves.toEqual({ code: ErrorCode.USER_ALREADY_EXISTS });
  });

  it('signs the user out everywhere when the password changes', async () => {
    await usersService.update('user-1', { password: 'new password' });

    expect(usersRepository.update.mock.calls[0][1].passwordHash).toEqual(expect.any(String));
    expect(authService.revokeUserSessions).toHaveBeenCalledWith('user-1');
  });

  it('keeps the password and sessions when only the name changes', async () => {
    await usersService.update('user-1', { name: 'Ada L.' });

    expect(usersRepository.update.mock.calls[0][1]).toEqual({ name: 'Ada L.', passwordHash: undefined });
    expect(authService.revokeUserSessions).not.toHaveBeenCalled();
  });

  it('refuses to delete the current user', async () => {
    await expect(responseOf(usersService.remove('user-1', 'user-1'))).resolves.toEqual({ code: ErrorCode.USER_SELF_DELETE });
    expect(usersRepository.delete).not.toHaveBeenCalled();
  });
});
