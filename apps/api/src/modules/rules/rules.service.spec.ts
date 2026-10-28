import { NotFoundException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

describe('RulesService', () => {
  let repository: jest.Mocked<Pick<RulesRepository, 'create' | 'findById' | 'update' | 'delete'>>;
  let service: RulesService;

  const rule = { id: 'r-1', type: RuleType.P90_FAILURE, description: 'no N+1' };

  beforeEach(() => {
    repository = { create: jest.fn(), findById: jest.fn(), update: jest.fn(), delete: jest.fn() };
    service = new RulesService(repository as unknown as RulesRepository);
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: NotFoundException) => e);
    return (error as NotFoundException).getResponse();
  };

  it('returns the rule', async () => {
    repository.findById.mockResolvedValue(rule as never);
    await expect(service.findOne('r-1')).resolves.toEqual(rule);
  });

  it('throws RULE_NOT_FOUND when missing', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(codeOf(service.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.RULE_NOT_FOUND,
    });
  });

  it('does not update a missing rule', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(codeOf(service.update('missing', { type: RuleType.P95_FAILURE }))).resolves.toEqual({
      code: ErrorCode.RULE_NOT_FOUND,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not delete a missing rule', async () => {
    repository.findById.mockResolvedValue(null);
    await codeOf(service.remove('missing'));
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('updates an existing rule', async () => {
    repository.findById.mockResolvedValue(rule as never);
    repository.update.mockResolvedValue({ ...rule, type: RuleType.P95_FAILURE } as never);
    await service.update('r-1', { type: RuleType.P95_FAILURE });
    expect(repository.update).toHaveBeenCalledWith('r-1', { type: RuleType.P95_FAILURE });
  });

  it('deletes an existing rule', async () => {
    repository.findById.mockResolvedValue(rule as never);
    await service.remove('r-1');
    expect(repository.delete).toHaveBeenCalledWith('r-1');
  });
});
