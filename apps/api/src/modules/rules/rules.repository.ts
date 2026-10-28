import { Injectable } from '@nestjs/common';
import type { Rule } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RulesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<Rule[]> {
    return this.prismaService.rule.findMany({ orderBy: { id: 'asc' } });
  }
}
