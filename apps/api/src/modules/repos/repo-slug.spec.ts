import { nextFreeSlug, toRepoSlug } from './repo-slug';

describe('toRepoSlug', () => {
  it.each([
    ['feat/ABC-123 Login', 'feat-abc-123-login'],
    ['  Release 1.2  ', 'release-1-2'],
    ['Thiết kế màn hình', 'thiet-ke-man-hinh'],
    ['///', 'repo'],
  ])('slugifies %p as %p', (name, slug) => {
    expect(toRepoSlug(name)).toBe(slug);
  });

  it('keeps the slug within the column size', () => {
    expect(toRepoSlug('a'.repeat(255)).length).toBeLessThanOrEqual(240);
  });
});

describe('nextFreeSlug', () => {
  it('keeps a free slug', () => {
    expect(nextFreeSlug('main', new Set(['dev']))).toBe('main');
  });

  it('suffixes a taken slug with the first free number', () => {
    expect(nextFreeSlug('main', new Set(['main', 'main-2']))).toBe('main-3');
  });
});
