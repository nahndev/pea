import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ConditionListView } from '@/modules/conditions';
import { PageHeader } from '@/shared/components/page-header';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { buildHref } from '@/shared/lib/pagination';
import { schemaParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Conditions' };

interface ConditionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConditionsPage({ searchParams }: ConditionsPageProps) {
  const { schema } = schemaParamsSchema.parse(await searchParams);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Conditions" description="Limits checked on each metric of an analysis schema. Open a condition to edit it." />
        <Link href={buildHref('/conditions/new', { schema })} className={buttonVariants({ size: 'sm' })}>
          Create condition
        </Link>
      </div>
      <SchemaTabs schema={schema} href={(value) => buildHref('/conditions', { schema: value })} />
      <ConditionListView schema={schema} />
    </>
  );
}
