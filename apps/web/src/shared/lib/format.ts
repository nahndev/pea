const DATE_TIME = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso));

export const formatNumber = (value: number) => NUMBER.format(value);

export const formatPercent = (value: number) => `${NUMBER.format(value)}%`;

export const formatDuration = (ms: number) => (ms >= 1000 ? `${NUMBER.format(ms / 1000)} s` : `${NUMBER.format(ms)} ms`);

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export const formatFileSize = (bytes: number) => {
  const exponent = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), FILE_SIZE_UNITS.length - 1);
  return `${NUMBER.format(bytes / 1024 ** exponent)} ${FILE_SIZE_UNITS[exponent]}`;
};
