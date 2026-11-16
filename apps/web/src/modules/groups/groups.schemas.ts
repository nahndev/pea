import { GroupSortField, Permission } from '@tomato/constants';
import { z } from 'zod';
import { orderingParam } from '@/shared/lib/sort';

export const groupSchema = z.object({
  name: z.string('required').trim().min(1, 'required').max(255, 'too_long'),
  permissions: z.array(z.enum(Object.values(Permission), 'invalid')),
});

export type GroupInput = z.infer<typeof groupSchema>;

export const groupListParamsSchema = z.object({ ordering: orderingParam(GroupSortField) });

export type GroupListParams = z.infer<typeof groupListParamsSchema>;
