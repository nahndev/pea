import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RepoSchemaPageBySchema, repoDetailParamsSchema } from '@/modules/repos';
import { schemaSlugParamsSchema } from '@/shared/lib/schema-params';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Repo analyses' };

interface RepoSchemaRoutePageProps {
  params: Promise<{ id: string; type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RepoSchemaRoutePage({ params, searchParams }: RepoSchemaRoutePageProps) {
  const { id: repoId, type } = await params;
  const parsed = schemaSlugParamsSchema.safeParse({ type });
  if (!parsed.success) notFound();
  const query = repoDetailParamsSchema.parse(await withCachedOrdering(SortTable.ANALYSES, await searchParams));

  return <RepoSchemaPageBySchema schema={parsed.data.type} repoId={repoId} params={query} />;
}
