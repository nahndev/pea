import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { ErrorCode } from '@tomato/constants';
import type { CurrentUser } from '@tomato/types';
import type { CookieOptions } from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { toPermissions } from '../../common/auth/permissions';
import { hashPassword, verifyPassword } from '../../common/crypto/password';
import { SESSION_TOKEN_BYTES, SESSION_TTL_MS } from './auth.constants';
import { AuthRepository } from './auth.repository';
import type { AuthUserRecord } from './auth.types';
import { LoginDto } from './dto/login.dto';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  /** Compared against for unknown usernames, so both cases take as long */
  private readonly dummyPasswordHash = hashPassword(randomUUID());

  readonly cookieOptions: CookieOptions;

  constructor(
    private readonly authRepository: AuthRepository,
    configService: ConfigService<Env, true>,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: configService.get('SESSION_COOKIE_SECURE', { infer: true }),
      path: '/',
    };
  }

  async login({ username, password }: LoginDto): Promise<{ token: string; user: CurrentUser }> {
    const user = await this.authRepository.findUserByUsername(username);
    const isValid = await verifyPassword(password, user?.passwordHash ?? (await this.dummyPasswordHash));
    if (!user || !isValid) throw new UnauthorizedException({ code: ErrorCode.INVALID_CREDENTIALS });

    const now = new Date();
    const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
    await this.authRepository.deleteExpiredSessions(now);
    await this.authRepository.createSession({ id: hashToken(token), userId: user.id, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) });
    return { token, user: this.toCurrentUser(user) };
  }

  async authenticate(token: string): Promise<CurrentUser | null> {
    const user = await this.authRepository.findSessionUser(hashToken(token), new Date());
    return user && this.toCurrentUser(user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.authRepository.deleteSession(hashToken(token));
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.authRepository.deleteUserSessions(userId);
  }

  private toCurrentUser({ id, name, username, group }: AuthUserRecord): CurrentUser {
    return { id, name, username, group: { id: group.id, name: group.name }, permissions: toPermissions(group.permissions) };
  }
}
