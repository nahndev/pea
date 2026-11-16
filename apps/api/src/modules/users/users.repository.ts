import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { USER_INCLUDE, type UserWithGroup } from './users.types';

interface UserData {
  name: string;
  username: string;
  passwordHash: string;
  groupId: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<UserWithGroup[]> {
    return this.prismaService.user.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }], include: USER_INCLUDE });
  }

  findById(id: string): Promise<UserWithGroup | null> {
    return this.prismaService.user.findUnique({ where: { id }, include: USER_INCLUDE });
  }

  create(data: UserData): Promise<UserWithGroup> {
    return this.prismaService.user.create({ data, include: USER_INCLUDE });
  }

  update(id: string, data: Partial<UserData>): Promise<UserWithGroup> {
    return this.prismaService.user.update({ where: { id }, data, include: USER_INCLUDE });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.user.delete({ where: { id } });
  }
}
