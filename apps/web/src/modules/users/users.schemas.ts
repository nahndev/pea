import { UserSortField } from '@tomato/constants';
import { z } from 'zod';
import { orderingParam } from '@/shared/lib/sort';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_PATTERN } from './users.constants';

const passwordSchema = z.string('required').min(PASSWORD_MIN_LENGTH, 'password_too_short').max(PASSWORD_MAX_LENGTH, 'too_long');

/** When editing, an empty password keeps the current one */
export const buildUserSchema = (isNew = true) =>
  z.object({
    name: z.string('required').trim().min(1, 'required').max(255, 'too_long'),
    username: z.string('required').trim().toLowerCase().min(1, 'required').max(USERNAME_MAX_LENGTH, 'too_long').regex(USERNAME_PATTERN, 'invalid_username'),
    password: isNew ? passwordSchema : z.preprocess((value) => (value === '' ? undefined : value), passwordSchema.optional()),
    groupId: z.string('required').min(1, 'required'),
  });

export type UserInput = z.infer<ReturnType<typeof buildUserSchema>>;

export const userListParamsSchema = z.object({ ordering: orderingParam(UserSortField) });

export type UserListParams = z.infer<typeof userListParamsSchema>;
