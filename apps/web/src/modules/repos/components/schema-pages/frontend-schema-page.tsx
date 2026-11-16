import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { FrontendTrendChart } from '@/modules/metrics';
import { RepoSchemaLayout } from '../repo-schema-layout';
import type { RepoSchemaPageProps } from './repo-schema-page.types';

export function FrontendSchemaPage({ repoId, params }: RepoSchemaPageProps) {
  return (
    <RepoSchemaLayout repoId={repoId} schema={AnalysisSchema.FRONTEND}>
      <FrontendTrendChart repoId={repoId} />
      <AnalysisListView repoId={repoId} schema={AnalysisSchema.FRONTEND} params={params} />
    </RepoSchemaLayout>
  );
}
