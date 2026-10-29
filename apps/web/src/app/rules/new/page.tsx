import type { Metadata } from 'next';
import { CreateRuleForm } from '@/modules/rules';
import { schemaParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Create rule' };

interface CreateRulePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CreateRulePage({ searchParams }: CreateRulePageProps) {
  const { schema } = schemaParamsSchema.parse(await searchParams);
  return <CreateRuleForm schema={schema} />;
}
