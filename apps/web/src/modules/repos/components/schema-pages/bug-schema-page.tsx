import { AnalysisSchema } from '@tomato/constants';
import { AnalysisListView } from '@/modules/analyses';
import { BugTrendChart } from '@/modules/metrics';
import { RepoSchemaLayout } from '../repo-schema-layout';
import type { RepoSchemaPageProps } from './repo-schema-page.types';

export function BugSchemaPage({ repoId, params }: RepoSchemaPageProps) {
  return (
    <RepoSchemaLayout repoId={repoId} schema={AnalysisSchema.BUG}>
      <BugTrendChart repoId={repoId} />
      <AnalysisListView repoId={repoId} schema={AnalysisSchema.BUG} params={params} />
    </RepoSchemaLayout>
  );
}
