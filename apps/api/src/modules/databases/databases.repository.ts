import { Injectable } from '@nestjs/common';
import type { DatabaseQueryStats, Prisma } from '../../generated/client';
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

  findByName(name: string): Promise<{ id: string } | null> {
    return this.prismaService.database.findUnique({ where: { name }, select: { id: true } });
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

  findQueryStats(databaseId: string): Promise<DatabaseQueryStats | null> {
    return this.prismaService.databaseQueryStats.findUnique({ where: { databaseId } });
  }

  async saveQueryStats(databaseId: string, data: { queries: Prisma.InputJsonObject; takenAt: Date }): Promise<void> {
    await this.prismaService.databaseQueryStats.upsert({ where: { databaseId }, create: { databaseId, ...data }, update: data });
  }
}
