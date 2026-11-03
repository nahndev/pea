import type { Prisma } from '../../generated/client';

export const DATABASE_INCLUDE = { _count: { select: { analyses: true } } } satisfies Prisma.DatabaseInclude;

export type DatabaseWithCount = Prisma.DatabaseGetPayload<{ include: typeof DATABASE_INCLUDE }>;
