const DATE_TIME = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso));

export const formatNumber = (value: number) => NUMBER.format(value);

export const formatDuration = (ms: number) => (ms >= 1000 ? `${NUMBER.format(ms / 1000)} s` : `${NUMBER.format(ms)} ms`);
