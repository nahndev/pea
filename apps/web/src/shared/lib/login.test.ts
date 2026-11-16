import { describe, expect, it } from 'vitest';
import { loginHref, safeNextPath } from './login';

describe('loginHref', () => {
  it('keeps the requested page with its query', () => {
    expect(loginHref('/branches?ordering=-name')).toBe('/login?next=%2Fbranches%3Fordering%3D-name');
  });
});

describe('safeNextPath', () => {
  it('accepts same-origin paths', () => {
    expect(safeNextPath('/rules/1')).toBe('/rules/1');
  });

  it.each([null, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/login'])('falls back to home for %s', (next) => {
    expect(safeNextPath(next)).toBe('/');
  });
});
