import { Injectable } from '@nestjs/common';
import type { RuleType } from '@tomato/constants';
import type { Rule } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRuleDto): Promise<Rule> {
    return this.prisma.rule.create({ data });
  }

  findById(id: string): Promise<Rule | null> {
    return this.prisma.rule.findUnique({ where: { id } });
  }

  async findMany(
    type: RuleType | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: Rule[]; total: number }> {
    const where = { type };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rule.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prisma.rule.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateRuleDto): Promise<Rule> {
    return this.prisma.rule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rule.delete({ where: { id } });
  }
}
