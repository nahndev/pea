import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { QueryTrendChart } from '@/modules/metrics';
import { RepoSchemaLayout } from '../repo-schema-layout';
import type { RepoSchemaPageProps } from './repo-schema-page.types';

export function QuerySchemaPage({ repoId, params }: RepoSchemaPageProps) {
  return (
    <RepoSchemaLayout repoId={repoId} schema={AnalysisSchema.QUERY}>
      <QueryTrendChart repoId={repoId} />
      <AnalysisListView repoId={repoId} schema={AnalysisSchema.QUERY} params={params} />
    </RepoSchemaLayout>
  );
}
