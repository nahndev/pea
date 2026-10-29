import type { Prisma } from '../../generated/client';

export type MetricConditionWithRelations = Prisma.MetricConditionGetPayload<{
  include: {
    metric: { select: { id: true; schema: true; type: true; unit: true; description: true; isActive: true } };
  };
}>;
