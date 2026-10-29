import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BranchSchemaPageBySchema, branchDetailParamsSchema } from '@/modules/branches';
import { schemaSlugParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Branch analyses' };

interface BranchSchemaRoutePageProps {
  params: Promise<{ id: string; type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BranchSchemaRoutePage({ params, searchParams }: BranchSchemaRoutePageProps) {
  const { id: branchId, type } = await params;
  const parsed = schemaSlugParamsSchema.safeParse({ type });
  if (!parsed.success) notFound();
  const { page } = branchDetailParamsSchema.parse(await searchParams);

  return <BranchSchemaPageBySchema schema={parsed.data.type} branchId={branchId} page={page} />;
}
