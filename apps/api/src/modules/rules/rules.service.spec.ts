import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import type { Rule } from '../../generated/client';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

describe('RulesService', () => {
  let rulesRepository: jest.Mocked<Pick<RulesRepository, 'findAll' | 'findById' | 'updateConfig'>>;
  let rulesService: RulesService;

  const slowApi: Rule = {
    id: 'r-1',
    type: RuleType.SLOW_API,
    description: 'Slow API',
    config: { thresholdMs: 2000 },
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    rulesRepository = { findAll: jest.fn(), findById: jest.fn(), updateConfig: jest.fn() };
    rulesService = new RulesService(rulesRepository as unknown as RulesRepository);
  });

  it('lists rules with their numeric config', async () => {
    rulesRepository.findAll.mockResolvedValue([{ ...slowApi, config: { thresholdMs: 2000, note: 'x' } }]);

    await expect(rulesService.findAll()).resolves.toEqual([
      { id: 'r-1', type: RuleType.SLOW_API, description: 'Slow API', config: { thresholdMs: 2000 } },
    ]);
  });

  it('returns one rule', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);

    await expect(rulesService.findOne('r-1')).resolves.toEqual({
      id: 'r-1',
      type: RuleType.SLOW_API,
      description: 'Slow API',
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
    rulesRepository.updateConfig.mockImplementation((_, config) => Promise.resolve({ ...rule, config: config as Rule['config'] }));

    const view = await rulesService.updateConfig('r-1', { thresholdMs: 3000 });

    expect(rulesRepository.updateConfig).toHaveBeenCalledWith('r-1', { thresholdMs: 3000, minRequests: 10 });
    expect(view.config).toEqual({ thresholdMs: 3000, minRequests: 10 });
  });

  it('throws RULE_NOT_FOUND for an unknown id', async () => {
    rulesRepository.findById.mockResolvedValue(null);

    const error = await rulesService.updateConfig('missing', { thresholdMs: 1 }).catch((e: NotFoundException) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({ code: ErrorCode.RULE_NOT_FOUND });
  });

  it('throws RULE_CONFIG_INVALID for a setting the rule does not have', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);

    const error = await rulesService.updateConfig('r-1', { maxPercent: 5 }).catch((e: BadRequestException) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.RULE_CONFIG_INVALID });
    expect(rulesRepository.updateConfig).not.toHaveBeenCalled();
  });

  it('keeps the rule unchanged when no setting is sent', async () => {
    rulesRepository.findById.mockResolvedValue(slowApi);

    await expect(rulesService.updateConfig('r-1', {})).resolves.toMatchObject({ config: { thresholdMs: 2000 } });
    expect(rulesRepository.updateConfig).not.toHaveBeenCalled();
  });
});
