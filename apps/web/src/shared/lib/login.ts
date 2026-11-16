export const LOGIN_PATH = '/login';
export const NEXT_PARAM = 'next';
export const HOME_PATH = '/';

export const loginHref = (next: string) => `${LOGIN_PATH}?${new URLSearchParams({ [NEXT_PARAM]: next })}`;

/** Same-origin paths only, so `next` cannot send the user to another site */
export const safeNextPath = (next: string | null | undefined) =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') && next !== LOGIN_PATH ? next : HOME_PATH;
