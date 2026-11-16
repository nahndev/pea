import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, SESSION_COOKIE } from '@tomato/constants';
import type { CurrentUser } from '@tomato/types';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthGuard } from './auth.guard';
import type { AuthService } from './auth.service';

@RequirePermission(Permission.MANAGER_RULE)
class TestController {
  @Public()
  open() {}

  signedIn() {}

  @RequirePermission(Permission.BRANCH_VIEW, Permission.BRANCH_ANALYSIS)
  either() {}
}

const viewer: CurrentUser = { id: 'user-1', name: 'Ada', username: 'ada', group: { id: 'group-1', name: 'Viewers' }, permissions: [Permission.BRANCH_VIEW] };

describe('AuthGuard', () => {
  let authService: { authenticate: jest.Mock; cookieOptions: object };
  let guard: AuthGuard;
  let request: { cookies: Record<string, string>; user?: CurrentUser };
  let response: { clearCookie: jest.Mock };

  const contextFor = (handler: keyof TestController) =>
    ({
      getHandler: () => TestController.prototype[handler],
      getClass: () => TestController,
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    authService = { authenticate: jest.fn().mockResolvedValue(viewer), cookieOptions: { path: '/' } };
    guard = new AuthGuard(new Reflector(), authService as unknown as AuthService);
    request = { cookies: { [SESSION_COOKIE]: 'token' } };
    response = { clearCookie: jest.fn() };
  });

  it('lets public routes through without a session', async () => {
    request.cookies = {};

    await expect(guard.canActivate(contextFor('open'))).resolves.toBe(true);
    expect(authService.authenticate).not.toHaveBeenCalled();
  });

  it('rejects requests without a session', async () => {
    request.cookies = {};

    await expect(guard.canActivate(contextFor('either'))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('clears the cookie of an unknown session', async () => {
    authService.authenticate.mockResolvedValue(null);

    await expect(guard.canActivate(contextFor('either'))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(response.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, { path: '/' });
  });

  it('passes with any of the method permissions and attaches the user', async () => {
    await expect(guard.canActivate(contextFor('either'))).resolves.toBe(true);
    expect(request.user).toBe(viewer);
  });

  it('falls back to the controller permissions', async () => {
    await expect(guard.canActivate(contextFor('signedIn'))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
