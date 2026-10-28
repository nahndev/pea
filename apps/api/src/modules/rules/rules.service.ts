import { Injectable } from '@nestjs/common';
import type { Rule } from '../../generated/client';
import { RulesRepository } from './rules.repository';

@Injectable()
export class RulesService {
  constructor(private readonly rulesRepository: RulesRepository) {}

  listAll(): Promise<Rule[]> {
    return this.rulesRepository.findAll();
  }
}
