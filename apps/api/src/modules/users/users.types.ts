import type { Prisma } from '../../generated/client';

export const USER_INCLUDE = { group: { select: { id: true, name: true } } } satisfies Prisma.UserInclude;

export type UserWithGroup = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;
