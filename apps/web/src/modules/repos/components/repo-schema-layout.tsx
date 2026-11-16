'use client';

import type { AnalysisSchema } from '@tomato/constants';
import type { ReactNode } from 'react';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { repoSchemaHref } from '../repo-schema-href';
import { useRepoAnalysisCounts } from '../hooks/use-repos';
import { RepoHeader } from './repo-header';

interface RepoSchemaLayoutProps {
  repoId: string;
  schema: AnalysisSchema;
  children: ReactNode;
}

export function RepoSchemaLayout({ repoId, schema, children }: RepoSchemaLayoutProps) {
  const { data: counts } = useRepoAnalysisCounts(repoId);

  return (
    <>
      <RepoHeader repoId={repoId} schema={schema} />
      <SchemaTabs schema={schema} href={(value) => repoSchemaHref(repoId, value)} counts={counts} />
      {children}
    </>
  );
}
