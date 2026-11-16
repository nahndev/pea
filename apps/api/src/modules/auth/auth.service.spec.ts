import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { ErrorCode, Permission } from '@tomato/constants';
import { hashPassword } from '../../common/crypto/password';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { AuthUserRecord } from './auth.types';

describe('AuthService', () => {
  const configService = { get: () => false } as unknown as ConfigService<Env, true>;
  let authRepository: jest.Mocked<Pick<AuthRepository, 'findUserByUsername' | 'findSessionUser' | 'createSession' | 'deleteSession' | 'deleteExpiredSessions' | 'deleteUserSessions'>>;
  let authService: AuthService;
  let user: AuthUserRecord;

  beforeAll(async () => {
    const createdAt = new Date('2026-11-01T00:00:00.000Z');
    user = {
      id: 'user-1',
      name: 'Ada',
      username: 'ada',
      passwordHash: await hashPassword('correct horse'),
      groupId: 'group-1',
      createdAt,
      updatedAt: createdAt,
      group: { id: 'group-1', name: 'Analysts', permissions: [Permission.REPO_VIEW, 'repo:removed'] },
    };
  });

  beforeEach(() => {
    authRepository = {
      findUserByUsername: jest.fn(),
      findSessionUser: jest.fn(),
      createSession: jest.fn(),
      deleteSession: jest.fn(),
      deleteExpiredSessions: jest.fn(),
      deleteUserSessions: jest.fn(),
    };
    authService = new AuthService(authRepository as unknown as AuthRepository, configService);
  });

  it('stores only the hash of the session token', async () => {
    authRepository.findUserByUsername.mockResolvedValue(user);

    const { token, user: currentUser } = await authService.login({ username: 'ada', password: 'correct horse' });

    const [{ id, userId, expiresAt }] = authRepository.createSession.mock.calls[0];
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain(token);
    expect(userId).toBe('user-1');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(currentUser).toEqual({ id: 'user-1', name: 'Ada', username: 'ada', group: { id: 'group-1', name: 'Analysts' }, permissions: [Permission.REPO_VIEW] });
  });

  it.each([
    ['an unknown username', null, 'correct horse'],
    ['a wrong password', 'known', 'wrong horse'],
  ])('rejects %s with the same error', async (_case, known, password) => {
    authRepository.findUserByUsername.mockResolvedValue(known ? user : null);

    const error = await authService.login({ username: 'ada', password }).catch((e: UnauthorizedException) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getResponse()).toEqual({ code: ErrorCode.INVALID_CREDENTIALS });
    expect(authRepository.createSession).not.toHaveBeenCalled();
  });

  it('finds the session by the token hash', async () => {
    authRepository.findUserByUsername.mockResolvedValue(user);
    const { token } = await authService.login({ username: 'ada', password: 'correct horse' });
    authRepository.findSessionUser.mockResolvedValue(user);

    await expect(authService.authenticate(token)).resolves.toMatchObject({ id: 'user-1' });
    expect(authRepository.findSessionUser.mock.calls[0][0]).toBe(authRepository.createSession.mock.calls[0][0].id);
  });

  it('returns no user for an unknown or expired session', async () => {
    authRepository.findSessionUser.mockResolvedValue(null);

    await expect(authService.authenticate('token')).resolves.toBeNull();
  });
});
