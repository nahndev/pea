import { redirect } from 'next/navigation';
import { repoSchemaHref } from '@/modules/repos';
import { DEFAULT_ANALYSIS_SCHEMA } from '@/shared/lib/analysis-schema.constants';

interface RepoPageProps {
  params: Promise<{ id: string }>;
}

export default async function RepoPage({ params }: RepoPageProps) {
  const { id } = await params;
  redirect(repoSchemaHref(id, DEFAULT_ANALYSIS_SCHEMA));
}
