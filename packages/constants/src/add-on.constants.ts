export const AddOn = {
  LEANEO: 'LEANEO',
} as const;

export type AddOn = (typeof AddOn)[keyof typeof AddOn];
