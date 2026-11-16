import type { Prisma } from '../../generated/client';

export const AUTH_USER_INCLUDE = { group: { select: { id: true, name: true, permissions: true } } } satisfies Prisma.UserInclude;

export type AuthUserRecord = Prisma.UserGetPayload<{ include: typeof AUTH_USER_INCLUDE }>;
