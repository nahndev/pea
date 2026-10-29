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

  update(id: string, data: { config?: Prisma.InputJsonObject; severity?: Severity }): Promise<Rule> {
    return this.prismaService.rule.update({ where: { id }, data });
  }
}
