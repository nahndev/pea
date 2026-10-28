import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { P90Handler } from './p90.handler';
import type { RuleHandler } from './rule-handler.types';

@Injectable()
export class RuleHandlerFactory {
  private readonly handlers: ReadonlyMap<string, RuleHandler>;

  constructor(p90Handler: P90Handler) {
    this.handlers = new Map([[RuleType.P90_FAILURE, p90Handler]]);
  }

  supports(type: string): boolean {
    return this.handlers.has(type);
  }

  create(type: string): RuleHandler {
    const handler = this.handlers.get(type);
    if (!handler) throw new UnprocessableEntityException({ code: ErrorCode.RULE_TYPE_UNSUPPORTED });
    return handler;
  }
}
