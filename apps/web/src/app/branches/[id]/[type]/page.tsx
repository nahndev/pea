import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BranchSchemaPageBySchema, branchDetailParamsSchema } from '@/modules/branches';
import { schemaSlugParamsSchema } from '@/shared/lib/schema-params';
import { withCachedOrdering } from '@/shared/lib/sort-cache';
import { SortTable } from '@/shared/lib/sort.constants';

export const metadata: Metadata = { title: 'Branch analyses' };

interface BranchSchemaRoutePageProps {
  params: Promise<{ id: string; type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BranchSchemaRoutePage({ params, searchParams }: BranchSchemaRoutePageProps) {
  const { id: branchId, type } = await params;
  const parsed = schemaSlugParamsSchema.safeParse({ type });
  if (!parsed.success) notFound();
  const query = branchDetailParamsSchema.parse(await withCachedOrdering(SortTable.ANALYSES, await searchParams));

  return <BranchSchemaPageBySchema schema={parsed.data.type} branchId={branchId} params={query} />;
}
