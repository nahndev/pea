import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { ApiTrendChart } from '@/modules/metrics';
import { RepoSchemaLayout } from '../repo-schema-layout';
import type { RepoSchemaPageProps } from './repo-schema-page.types';

export function ApiSchemaPage({ repoId, params }: RepoSchemaPageProps) {
  return (
    <RepoSchemaLayout repoId={repoId} schema={AnalysisSchema.API}>
      <ApiTrendChart repoId={repoId} />
      <AnalysisListView repoId={repoId} schema={AnalysisSchema.API} params={params} />
    </RepoSchemaLayout>
  );
}
