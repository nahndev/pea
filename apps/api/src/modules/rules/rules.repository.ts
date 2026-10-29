import { Injectable } from '@nestjs/common';
import type { Severity } from '@tomato/constants';
import type { Prisma, Rule } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RulesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<Rule[]> {
    return this.prismaService.rule.findMany({ orderBy: { id: 'asc' } });
  }

  findById(id: string): Promise<Rule | null> {
    return this.prismaService.rule.findUnique({ where: { id } });
  }

  findByTypeAndDescription(type: string, description: string): Promise<Rule | null> {
    return this.prismaService.rule.findFirst({ where: { type, description } });
  }

  create(data: { type: string; description: string; severity: Severity; config: Prisma.InputJsonObject }): Promise<Rule> {
    return this.prismaService.rule.create({ data });
  }

  update(id: string, data: { config?: Prisma.InputJsonObject; severity?: Severity }): Promise<Rule> {
    return this.prismaService.rule.update({ where: { id }, data });
  }
}
