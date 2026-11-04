import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { BugTrendChart } from '@/modules/metrics';
import { BranchSchemaLayout } from '../branch-schema-layout';
import type { BranchSchemaPageProps } from './branch-schema-page.types';

export function BugSchemaPage({ branchId, params }: BranchSchemaPageProps) {
  return (
    <BranchSchemaLayout branchId={branchId} schema={AnalysisSchema.BUG}>
      <BugTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={AnalysisSchema.BUG} params={params} />
    </BranchSchemaLayout>
  );
}
