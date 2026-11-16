import type { AnalysisSchema } from '@tomato/constants';

/** `idOrSlug`: links use the slug, the uuid still resolves */
export const repoSchemaHref = (idOrSlug: string, schema: AnalysisSchema) =>
  `/repos/${idOrSlug}/${schema.toLowerCase()}`;
