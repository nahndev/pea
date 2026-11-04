import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { DatabaseTrendChart } from '@/modules/metrics';
import { BranchSchemaLayout } from '../branch-schema-layout';
import type { BranchSchemaPageProps } from './branch-schema-page.types';

export function DatabaseSchemaPage({ branchId, params }: BranchSchemaPageProps) {
  return (
    <BranchSchemaLayout branchId={branchId} schema={AnalysisSchema.DATABASE}>
      <DatabaseTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={AnalysisSchema.DATABASE} params={params} />
    </BranchSchemaLayout>
  );
}
