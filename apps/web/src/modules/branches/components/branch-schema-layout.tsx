'use client';

import type { AnalysisSchema } from '@tomato/constants';
import type { ReactNode } from 'react';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { branchSchemaHref } from '../branch-schema-href';
import { useBranchAnalysisCounts } from '../hooks/use-branches';
import { BranchHeader } from './branch-header';

interface BranchSchemaLayoutProps {
  branchId: string;
  schema: AnalysisSchema;
  children: ReactNode;
}

export function BranchSchemaLayout({ branchId, schema, children }: BranchSchemaLayoutProps) {
  const { data: counts } = useBranchAnalysisCounts(branchId);

  return (
    <>
      <BranchHeader branchId={branchId} schema={schema} />
      <SchemaTabs schema={schema} href={(value) => branchSchemaHref(branchId, value)} counts={counts} />
      {children}
    </>
  );
}
