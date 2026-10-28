import type { AnalysisContextType } from '@tomato/constants';
import type { Prisma } from '../../generated/client';
import type { StoredFile } from '../files/storage.service';

export type AnalysisWithContexts = Prisma.AnalysisGetPayload<{ include: { contexts: true } }>;

export type AnalysisContextFile = StoredFile & { type: AnalysisContextType };
