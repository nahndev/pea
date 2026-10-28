import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { P90Handler } from './p90.handler';
import { RuleHandlerFactory } from './rule-handler.factory';

describe('RuleHandlerFactory', () => {
  const p90Handler = {} as P90Handler;
  const ruleHandlerFactory = new RuleHandlerFactory(p90Handler);

  it('returns the handler of the rule type', () => {
    expect(ruleHandlerFactory.create(RuleType.P90_FAILURE)).toBe(p90Handler);
  });

  it('throws RULE_TYPE_UNSUPPORTED when no handler exists', () => {
    expect.assertions(1);
    try {
      ruleHandlerFactory.create(RuleType.P95_FAILURE);
    } catch (error) {
      expect((error as UnprocessableEntityException).getResponse()).toEqual({
        code: ErrorCode.RULE_TYPE_UNSUPPORTED,
      });
    }
  });
});
