import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { DatabaseTrendChart } from '@/modules/metrics';
import { RepoSchemaLayout } from '../repo-schema-layout';
import type { RepoSchemaPageProps } from './repo-schema-page.types';

export function DatabaseSchemaPage({ repoId, params }: RepoSchemaPageProps) {
  return (
    <RepoSchemaLayout repoId={repoId} schema={AnalysisSchema.DATABASE}>
      <DatabaseTrendChart repoId={repoId} />
      <AnalysisListView repoId={repoId} schema={AnalysisSchema.DATABASE} params={params} />
    </RepoSchemaLayout>
  );
}
