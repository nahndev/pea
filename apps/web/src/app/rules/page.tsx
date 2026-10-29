import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RuleListView } from '@/modules/rules';
import { PageHeader } from '@/shared/components/page-header';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { buildHref } from '@/shared/lib/pagination';
import { schemaParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Rules' };

interface RulesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const { schema } = schemaParamsSchema.parse(await searchParams);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Rules" description="Rules used to create issues. Open a rule to configure it." />
        <Link href={buildHref('/rules/new', { schema })} className={buttonVariants({ size: 'sm' })}>
          Create rule
        </Link>
      </div>
      <SchemaTabs pathname="/rules" schema={schema} />
      <RuleListView schema={schema} />
    </>
  );
}
