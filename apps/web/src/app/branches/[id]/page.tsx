import { redirect } from 'next/navigation';
import { branchSchemaHref } from '@/modules/branches';
import { DEFAULT_ANALYSIS_SCHEMA } from '@/shared/lib/analysis-schema.constants';

interface BranchPageProps {
  params: Promise<{ id: string }>;
}

export default async function BranchPage({ params }: BranchPageProps) {
  const { id } = await params;
  redirect(branchSchemaHref(id, DEFAULT_ANALYSIS_SCHEMA));
}
