import type { AnalysisSchema } from '@tomato/constants';

export const branchSchemaHref = (branchId: string, schema: AnalysisSchema) =>
  `/branches/${branchId}/${schema.toLowerCase()}`;
