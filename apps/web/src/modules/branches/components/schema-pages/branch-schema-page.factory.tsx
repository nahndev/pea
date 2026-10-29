import { AnalysisSchema } from '@tomato/constants';
import type { ComponentType } from 'react';
import { ApiSchemaPage } from './api-schema-page';
import { BugSchemaPage } from './bug-schema-page';
import type { BranchSchemaPageProps } from './branch-schema-page.types';
import { QuerySchemaPage } from './query-schema-page';

const SCHEMA_PAGE_BY_SCHEMA: Record<AnalysisSchema, ComponentType<BranchSchemaPageProps>> = {
  [AnalysisSchema.API]: ApiSchemaPage,
  [AnalysisSchema.QUERY]: QuerySchemaPage,
  [AnalysisSchema.BUG]: BugSchemaPage,
};

export function BranchSchemaPageBySchema({ schema, ...props }: BranchSchemaPageProps & { schema: AnalysisSchema }) {
  const SchemaPage = SCHEMA_PAGE_BY_SCHEMA[schema];
  return <SchemaPage {...props} />;
}
