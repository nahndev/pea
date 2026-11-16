const MAX_BASE_LENGTH = 240;
const FALLBACK_SLUG = 'repo';

export const toRepoSlug = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/^-+|-+$/g, '') || FALLBACK_SLUG;

/** First of `slug`, `slug-2`, `slug-3`… not in `taken` */
export const nextFreeSlug = (slug: string, taken: ReadonlySet<string>): string => {
  if (!taken.has(slug)) return slug;
  let suffix = 2;
  while (taken.has(`${slug}-${suffix}`)) suffix++;
  return `${slug}-${suffix}`;
};
