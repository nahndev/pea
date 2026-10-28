import { NotFoundException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

describe('RulesService', () => {
  let rulesRepository: jest.Mocked<Pick<RulesRepository, 'create' | 'findById' | 'update' | 'delete'>>;
  let rulesService: RulesService;

  const rule = { id: 'r-1', type: RuleType.P90_FAILURE, description: 'no N+1' };

  beforeEach(() => {
    rulesRepository = { create: jest.fn(), findById: jest.fn(), update: jest.fn(), delete: jest.fn() };
    rulesService = new RulesService(rulesRepository as unknown as RulesRepository);
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: NotFoundException) => e);
    return (error as NotFoundException).getResponse();
  };

  it('returns the rule', async () => {
    rulesRepository.findById.mockResolvedValue(rule as never);
    await expect(rulesService.findOne('r-1')).resolves.toEqual(rule);
  });

  it('throws RULE_NOT_FOUND when missing', async () => {
    rulesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(rulesService.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.RULE_NOT_FOUND,
    });
  });

  it('does not update a missing rule', async () => {
    rulesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(rulesService.update('missing', { type: RuleType.P95_FAILURE }))).resolves.toEqual({
      code: ErrorCode.RULE_NOT_FOUND,
    });
    expect(rulesRepository.update).not.toHaveBeenCalled();
  });

  it('does not delete a missing rule', async () => {
    rulesRepository.findById.mockResolvedValue(null);
    await codeOf(rulesService.remove('missing'));
    expect(rulesRepository.delete).not.toHaveBeenCalled();
  });

  it('updates an existing rule', async () => {
    rulesRepository.findById.mockResolvedValue(rule as never);
    rulesRepository.update.mockResolvedValue({ ...rule, type: RuleType.P95_FAILURE } as never);
    await rulesService.update('r-1', { type: RuleType.P95_FAILURE });
    expect(rulesRepository.update).toHaveBeenCalledWith('r-1', { type: RuleType.P95_FAILURE });
  });

  it('deletes an existing rule', async () => {
    rulesRepository.findById.mockResolvedValue(rule as never);
    await rulesService.remove('r-1');
    expect(rulesRepository.delete).toHaveBeenCalledWith('r-1');
  });
});
