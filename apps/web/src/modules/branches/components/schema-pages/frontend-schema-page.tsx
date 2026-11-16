import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { FrontendTrendChart } from '@/modules/metrics';
import { BranchSchemaLayout } from '../branch-schema-layout';
import type { BranchSchemaPageProps } from './branch-schema-page.types';

export function FrontendSchemaPage({ branchId, params }: BranchSchemaPageProps) {
  return (
    <BranchSchemaLayout branchId={branchId} schema={AnalysisSchema.FRONTEND}>
      <FrontendTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={AnalysisSchema.FRONTEND} params={params} />
    </BranchSchemaLayout>
  );
}
