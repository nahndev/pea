import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GROUP_INCLUDE, type GroupWithUsers } from './groups.types';

@Injectable()
export class GroupsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<GroupWithUsers[]> {
    return this.prismaService.group.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }], include: GROUP_INCLUDE });
  }

  findById(id: string): Promise<GroupWithUsers | null> {
    return this.prismaService.group.findUnique({ where: { id }, include: GROUP_INCLUDE });
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prismaService.group.count({ where: { id } })) > 0;
  }

  create(data: { name: string; permissions: string[] }): Promise<GroupWithUsers> {
    return this.prismaService.group.create({ data, include: GROUP_INCLUDE });
  }

  update(id: string, data: { name?: string; permissions?: string[] }): Promise<GroupWithUsers> {
    return this.prismaService.group.update({ where: { id }, data, include: GROUP_INCLUDE });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.group.delete({ where: { id } });
  }
}
