export const AddOnHeader = {
  CONVERTED_COUNT: 'x-converted-count',
  SKIPPED_COUNT: 'x-skipped-count',
} as const;

export type AddOnHeader = (typeof AddOnHeader)[keyof typeof AddOnHeader];
