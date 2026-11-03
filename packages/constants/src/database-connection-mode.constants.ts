export const DatabaseConnectionMode = {
  FIELDS: 'FIELDS',
  URL: 'URL',
} as const;

export type DatabaseConnectionMode = (typeof DatabaseConnectionMode)[keyof typeof DatabaseConnectionMode];
