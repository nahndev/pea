import type { AnalysisSchema } from '@tomato/constants';
import type { ReactNode } from 'react';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { branchSchemaHref } from '../branch-schema-href';
import { BranchHeader } from './branch-header';

interface BranchSchemaLayoutProps {
  branchId: string;
  schema: AnalysisSchema;
  children: ReactNode;
}

export function BranchSchemaLayout({ branchId, schema, children }: BranchSchemaLayoutProps) {
  return (
    <>
      <BranchHeader branchId={branchId} schema={schema} />
      <SchemaTabs schema={schema} href={(value) => branchSchemaHref(branchId, value)} />
      {children}
    </>
  );
}
