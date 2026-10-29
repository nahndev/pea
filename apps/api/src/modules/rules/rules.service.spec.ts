import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ErrorCode, RuleType, Severity } from '@tomato/constants';
import type { Rule } from '../../generated/client';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

describe('RulesService', () => {
  let rulesRepository: jest.Mocked<Pick<RulesRepository, 'findAll' | 'findById' | 'findByTypeAndDescription' | 'create' | 'update'>>;
  let rulesService: RulesService;

  const slowApi: Rule = {
    id: 'r-1',
    type: RuleType.SLOW_API,
    description: 'Slow API',
    severity: Severity.LOW,
    config: { thresholdMs: 2000 },
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    rulesRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTypeAndDescription: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    };
    rulesService = new RulesService(rulesRepository as unknown as RulesRepository);
  });

  it('lists rules with their numeric config', async () => {
    rulesRepository.findAll.mockResolvedValue([{ ...slowApi, config: { thresholdMs: 2000, note: 'x' } }]);

    await expect(rulesService.findAll()).resolves.toEqual([
      { id: 'r-1', type: RuleType.SLOW_API, description: 'Slow API', severity: Severity.LOW, config: { thresholdMs: 2000 } },
    ]);
  });

  describe('create', () => {
    const dto = {
      type: RuleType.SLOW_ROUTE,
      description: 'Strict slow route',
      severity: Severity.HIGH,
      config: { thresholdMs: 800, minRequests: 5 },
    };

    it('creates a rule of the given type with its own config', async () => {
      rulesRepository.create.mockResolvedValue({ ...slowApi, id: 'r-2', ...dto });

      await expect(rulesService.create(dto)).resolves.toEqual({ id: 'r-2', ...dto });
      expect(rulesRepository.create).toHaveBeenCalledWith({
        type: RuleType.SLOW_ROUTE,
        description: 'Strict slow route',
        severity: Severity.HIGH,
        config: { thresholdMs: 800, minRequests: 5 },
      });
    });

    it('throws RULE_CONFIG_INVALID when a setting of the type is missing', async () => {
      const error = await rulesService
        .create({ ...dto, config: { thresholdMs: 800 } })
        .catch((e: BadRequestException) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.RULE_CONFIG_INVALID });
      expect(rulesRepository.create).not.toHaveBeenCalled();
    });

    it('throws RULE_CONFIG_INVALID for a setting the type does not have', async () => {
      const error = await rulesService
        .create({ ...dto, config: { thresholdMs: 800, minRequests: 5, maxPercent: 5 } })
        .catch((e: BadRequestException) => e);

      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.RULE_CONFIG_INVALID });
    });

    it('throws RULE_ALREADY_EXISTS for a duplicate type and title', async () => {
      rulesRepository.findByTypeAndDescription.mockResolvedValue(slowApi);

      const error = await rulesService.create(dto).catch((e: ConflictException) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({ code: ErrorCode.RULE_ALREADY_EXISTS });
      expect(rulesRepository.create).not.toHaveBeenCalled();
    });
  });

  it('returns one rule', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);

    await expect(rulesService.findOne('r-1')).resolves.toEqual({
      id: 'r-1',
      type: RuleType.SLOW_API,
      description: 'Slow API',
      severity: Severity.LOW,
      config: { thresholdMs: 2000 },
    });
  });

  it('throws RULE_NOT_FOUND when reading an unknown id', async () => {
    rulesRepository.findById.mockResolvedValue(null);

    const error = await rulesService.findOne('missing').catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.RULE_NOT_FOUND });
  });

  it('merges the changes into the existing config', async () => {
    const rule: Rule = { ...slowApi, config: { thresholdMs: 1500, minRequests: 10 } };
    rulesRepository.findById.mockResolvedValue(rule);
    rulesRepository.update.mockImplementation((_, { config }) =>
      Promise.resolve({ ...rule, config: (config ?? rule.config) as Rule['config'] }),
    );

    const view = await rulesService.update('r-1', { thresholdMs: 3000 });

    expect(rulesRepository.update).toHaveBeenCalledWith('r-1', {
      severity: undefined,
      config: { thresholdMs: 3000, minRequests: 10 },
    });
    expect(view.config).toEqual({ thresholdMs: 3000, minRequests: 10 });
  });

  it('throws RULE_NOT_FOUND for an unknown id', async () => {
    rulesRepository.findById.mockResolvedValue(null);

    const error = await rulesService.update('missing', { thresholdMs: 1 }).catch((e: NotFoundException) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.RULE_NOT_FOUND });
  });

  it('throws RULE_CONFIG_INVALID for a setting the rule does not have', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);

    const error = await rulesService.update('r-1', { maxPercent: 5 }).catch((e: BadRequestException) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.RULE_CONFIG_INVALID });
    expect(rulesRepository.update).not.toHaveBeenCalled();
  });

  it('updates only the severity and keeps the config', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);
    rulesRepository.update.mockResolvedValue({ ...slowApi, severity: Severity.BLOCKER });

    const view = await rulesService.update('r-1', { severity: Severity.BLOCKER });

    expect(rulesRepository.update).toHaveBeenCalledWith('r-1', { severity: Severity.BLOCKER, config: undefined });
    expect(view).toMatchObject({ severity: Severity.BLOCKER, config: { thresholdMs: 2000 } });
  });

  it('keeps the rule unchanged when no setting is sent', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);

    await expect(rulesService.update('r-1', {})).resolves.toMatchObject({ config: { thresholdMs: 2000 } });
    expect(rulesRepository.update).not.toHaveBeenCalled();
  });
});
