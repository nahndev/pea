import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { CurrentUser } from '@tomato/types';
import type { AuthenticatedRequest } from '../auth/authenticated-request.types';

export const AuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
