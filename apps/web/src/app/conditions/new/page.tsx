import type { Metadata } from 'next';
import { ConditionCreateForm } from '@/modules/conditions';
import { schemaParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Create condition' };

interface CreateConditionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CreateConditionPage({ searchParams }: CreateConditionPageProps) {
  const { schema } = schemaParamsSchema.parse(await searchParams);
  return <ConditionCreateForm schema={schema} />;
}
