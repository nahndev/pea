import type { Prisma } from '../../generated/client';

export type QualityGateWithConditions = Prisma.QualityGateGetPayload<{ include: { conditions: true } }>;

export type MetricConditionWithRelations = Prisma.MetricConditionGetPayload<{
  include: {
    qualityGate: { select: { id: true; name: true } };
    metric: { select: { id: true; type: true; unit: true; description: true } };
  };
}>;
