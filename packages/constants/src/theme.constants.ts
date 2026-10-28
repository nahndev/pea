export const Theme = {
  TWILIGHT: 'twilight',
} as const;

export type Theme = (typeof Theme)[keyof typeof Theme];
