import { Injectable } from '@nestjs/common';
import type { RuleType } from '@tomato/constants';
import type { Rule } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: CreateRuleDto): Promise<Rule> {
    return this.prismaService.rule.create({ data });
  }

  findAll(): Promise<Rule[]> {
    return this.prismaService.rule.findMany({ orderBy: { id: 'asc' } });
  }

  findById(id: string): Promise<Rule | null> {
    return this.prismaService.rule.findUnique({ where: { id } });
  }

  async findMany(
    type: RuleType | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: Rule[]; total: number }> {
    const where = { type };
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.rule.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prismaService.rule.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateRuleDto): Promise<Rule> {
    return this.prismaService.rule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.rule.delete({ where: { id } });
  }
}
