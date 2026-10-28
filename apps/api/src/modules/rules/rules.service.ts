import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import type { Rule } from '../../generated/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { ListRulesQueryDto } from './dto/list-rules-query.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RulesRepository } from './rules.repository';

@Injectable()
export class RulesService {
  constructor(private readonly rulesRepository: RulesRepository) {}

  create(dto: CreateRuleDto): Promise<Rule> {
    return this.rulesRepository.create(dto);
  }

  listAll(): Promise<Rule[]> {
    return this.rulesRepository.findAll();
  }

  findAll({ type, limit, offset }: ListRulesQueryDto): Promise<Paginated<Rule>> {
    return this.rulesRepository.findMany(type, limit, offset);
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.rulesRepository.findById(id);
    if (!rule) throw new NotFoundException({ code: ErrorCode.RULE_NOT_FOUND });
    return rule;
  }

  async update(id: string, dto: UpdateRuleDto): Promise<Rule> {
    await this.findOne(id);
    return this.rulesRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.rulesRepository.delete(id);
  }
}
