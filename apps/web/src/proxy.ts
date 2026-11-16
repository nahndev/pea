import { SESSION_COOKIE } from '@tomato/constants';
import { type NextRequest, NextResponse } from 'next/server';
import { loginHref } from '@/shared/lib/login';

/** Only checks the cookie is there; the api validates the session */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(new URL(loginHref(pathname + search), request.url));
}

export const config = {
  matcher: ['/((?!rest/|login|_next/|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
