import { AnalysisContextType } from '@tomato/constants';

export const CONTEXT_TYPE_BY_FIELD: ReadonlyMap<string, AnalysisContextType> = new Map(
  Object.values(AnalysisContextType).map((type) => [type.toLowerCase(), type]),
);
export const LOG_FILE_FIELDS = [...CONTEXT_TYPE_BY_FIELD.keys()].map((name) => ({ name, maxCount: 1 }));
export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;
