import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_USER_INCLUDE, type AuthUserRecord } from './auth.types';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUserByUsername(username: string): Promise<AuthUserRecord | null> {
    return this.prismaService.user.findUnique({ where: { username }, include: AUTH_USER_INCLUDE });
  }

  async findSessionUser(id: string, now: Date): Promise<AuthUserRecord | null> {
    const session = await this.prismaService.session.findUnique({ where: { id }, include: { user: { include: AUTH_USER_INCLUDE } } });
    return session && session.expiresAt > now ? session.user : null;
  }

  async createSession(data: { id: string; userId: string; expiresAt: Date }): Promise<void> {
    await this.prismaService.session.create({ data });
  }

  async deleteSession(id: string): Promise<void> {
    await this.prismaService.session.deleteMany({ where: { id } });
  }

  async deleteExpiredSessions(now: Date): Promise<void> {
    await this.prismaService.session.deleteMany({ where: { expiresAt: { lte: now } } });
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.prismaService.session.deleteMany({ where: { userId } });
  }
}
