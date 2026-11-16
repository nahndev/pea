import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, type Permission, SESSION_COOKIE } from '@tomato/constants';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/auth/authenticated-request.types';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../common/decorators/require-permission.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    const user = typeof token === 'string' ? await this.authService.authenticate(token) : null;
    if (!user) {
      if (token) http.getResponse<Response>().clearCookie(SESSION_COOKIE, this.authService.cookieOptions);
      throw new UnauthorizedException({ code: ErrorCode.UNAUTHORIZED });
    }
    request.user = user;

    const permissions = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, targets);
    if (permissions?.length && !permissions.some((permission) => user.permissions.includes(permission))) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    }
    return true;
  }
}
