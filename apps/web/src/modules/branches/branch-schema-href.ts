import type { AnalysisSchema } from '@tomato/constants';

/** `idOrSlug`: links use the slug, the uuid still resolves */
export const branchSchemaHref = (idOrSlug: string, schema: AnalysisSchema) =>
  `/branches/${idOrSlug}/${schema.toLowerCase()}`;
