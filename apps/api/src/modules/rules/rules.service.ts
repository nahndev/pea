import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { type AnalysisSchema, ErrorCode, type RuleType, type Severity } from '@tomato/constants';
import type { RuleView } from '@tomato/types';
import type { Rule } from '../../generated/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { CONFIG_FIELDS_BY_RULE_TYPE } from './rules.constants';
import { RulesRepository } from './rules.repository';

@Injectable()
export class RulesService {
  constructor(private readonly rulesRepository: RulesRepository) {}

  listBySchema(schema: AnalysisSchema): Promise<Rule[]> {
    return this.rulesRepository.findAll({ schema });
  }

  async findAll(filter: { schema?: AnalysisSchema } = {}): Promise<RuleView[]> {
    const rules = await this.rulesRepository.findAll(filter);
    return rules.map((rule) => this.toView(rule));
  }

  async findOne(id: string): Promise<RuleView> {
    const rule = await this.rulesRepository.findById(id);
    if (!rule) throw new NotFoundException({ code: ErrorCode.RULE_NOT_FOUND });
    return this.toView(rule);
  }

  async create({ schema, type, description, severity, config }: CreateRuleDto): Promise<RuleView> {
    const required: readonly string[] = CONFIG_FIELDS_BY_RULE_TYPE[type];
    const entries = Object.entries(config).filter(([, value]) => value !== undefined);
    if (entries.length !== required.length || entries.some(([field]) => !required.includes(field))) {
      throw new BadRequestException({ code: ErrorCode.RULE_CONFIG_INVALID });
    }
    if (await this.rulesRepository.findByTypeAndDescription(schema, type, description)) {
      throw new ConflictException({ code: ErrorCode.RULE_ALREADY_EXISTS });
    }

    const rule = await this.rulesRepository.create({ schema, type, description, severity, config: Object.fromEntries(entries) });
    return this.toView(rule);
  }

  async update(id: string, { severity, ...changes }: UpdateRuleDto): Promise<RuleView> {
    const rule = await this.rulesRepository.findById(id);
    if (!rule) throw new NotFoundException({ code: ErrorCode.RULE_NOT_FOUND });

    const config = this.numericConfig(rule);
    const entries = Object.entries(changes).filter(([, value]) => value !== undefined);
    if (entries.some(([field]) => !(field in config))) {
      throw new BadRequestException({ code: ErrorCode.RULE_CONFIG_INVALID });
    }
    if (!entries.length && !severity) return this.toView(rule);

    const updated = await this.rulesRepository.update(id, {
      severity,
      config: entries.length ? { ...config, ...Object.fromEntries(entries) } : undefined,
    });
    return this.toView(updated);
  }

  private toView(rule: Rule): RuleView {
    return {
      id: rule.id,
      schema: rule.schema as AnalysisSchema,
      type: rule.type as RuleType,
      description: rule.description,
      severity: rule.severity as Severity,
      config: this.numericConfig(rule),
    };
  }

  private numericConfig({ config }: Rule): Record<string, number> {
    if (typeof config !== 'object' || config === null || Array.isArray(config)) return {};
    return Object.fromEntries(Object.entries(config).filter(([, value]) => typeof value === 'number')) as Record<
      string,
      number
    >;
  }
}
