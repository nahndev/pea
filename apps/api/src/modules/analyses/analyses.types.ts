import type { Prisma } from '../../generated/client';

export type AnalysisWithContexts = Prisma.AnalysisGetPayload<{ include: { contexts: true } }>;
