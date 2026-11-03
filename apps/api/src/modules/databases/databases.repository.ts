import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DATABASE_INCLUDE, type DatabaseWithCount } from './databases.types';

@Injectable()
export class DatabasesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<DatabaseWithCount[]> {
    return this.prismaService.database.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }], include: DATABASE_INCLUDE });
  }

  findById(id: string): Promise<DatabaseWithCount | null> {
    return this.prismaService.database.findUnique({ where: { id }, include: DATABASE_INCLUDE });
  }

  create(data: { name: string; connection: string }): Promise<DatabaseWithCount> {
    return this.prismaService.database.create({ data, include: DATABASE_INCLUDE });
  }

  update(id: string, data: { name?: string; connection?: string }): Promise<DatabaseWithCount> {
    return this.prismaService.database.update({ where: { id }, data, include: DATABASE_INCLUDE });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.database.delete({ where: { id } });
  }
}
