import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { QueryTrendChart } from '@/modules/metrics';
import { BranchSchemaLayout } from '../branch-schema-layout';
import type { BranchSchemaPageProps } from './branch-schema-page.types';

export function QuerySchemaPage({ branchId, page }: BranchSchemaPageProps) {
  return (
    <BranchSchemaLayout branchId={branchId} schema={AnalysisSchema.QUERY}>
      <QueryTrendChart branchId={branchId} />
      <AnalysisListView branchId={branchId} schema={AnalysisSchema.QUERY} page={page} />
    </BranchSchemaLayout>
  );
}
