import type { Prisma } from '../../generated/client';

export const GROUP_INCLUDE = {
  users: { select: { id: true, name: true, username: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.GroupInclude;

export type GroupWithUsers = Prisma.GroupGetPayload<{ include: typeof GROUP_INCLUDE }>;
