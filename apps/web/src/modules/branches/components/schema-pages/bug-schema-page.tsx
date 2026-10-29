import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { BugTrendChart } from '@/modules/metrics';
import { BranchSchemaLayout } from '../branch-schema-layout';
import type { BranchSchemaPageProps } from './branch-schema-page.types';

export function BugSchemaPage({ branchId, page }: BranchSchemaPageProps) {
  return (
    <BranchSchemaLayout branchId={branchId} schema={AnalysisSchema.BUG}>
      <BugTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={AnalysisSchema.BUG} page={page} />
    </BranchSchemaLayout>
  );
}
