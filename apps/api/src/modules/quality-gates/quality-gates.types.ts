import type { Prisma } from '../../generated/client';

export type QualityGateWithConditions = Prisma.QualityGateGetPayload<{ include: { conditions: true } }>;
