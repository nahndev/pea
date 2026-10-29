import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { ApiTrendChart } from '@/modules/metrics';
import { BranchSchemaLayout } from '../branch-schema-layout';
import type { BranchSchemaPageProps } from './branch-schema-page.types';

export function ApiSchemaPage({ branchId, page }: BranchSchemaPageProps) {
  return (
    <BranchSchemaLayout branchId={branchId} schema={AnalysisSchema.API}>
      <ApiTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={AnalysisSchema.API} page={page} />
    </BranchSchemaLayout>
  );
}
