import { AnalysisSchema } from '@tomato/constants';
import type { ComponentType } from 'react';
import { ApiSchemaPage } from './api-schema-page';
import { BugSchemaPage } from './bug-schema-page';
import type { RepoSchemaPageProps } from './repo-schema-page.types';
import { DatabaseSchemaPage } from './database-schema-page';
import { FrontendSchemaPage } from './frontend-schema-page';
import { QuerySchemaPage } from './query-schema-page';

const SCHEMA_PAGE_BY_SCHEMA: Record<AnalysisSchema, ComponentType<RepoSchemaPageProps>> = {
  [AnalysisSchema.API]: ApiSchemaPage,
  [AnalysisSchema.QUERY]: QuerySchemaPage,
  [AnalysisSchema.BUG]: BugSchemaPage,
  [AnalysisSchema.DATABASE]: DatabaseSchemaPage,
  [AnalysisSchema.FRONTEND]: FrontendSchemaPage,
};

export function RepoSchemaPageBySchema({ schema, ...props }: RepoSchemaPageProps & { schema: AnalysisSchema }) {
  const SchemaPage = SCHEMA_PAGE_BY_SCHEMA[schema];
  return <SchemaPage {...props} />;
}
