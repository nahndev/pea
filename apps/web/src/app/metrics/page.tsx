import type { Metadata } from 'next';
import { MetricListView } from '@/modules/metrics';
import { PageHeader } from '@/shared/components/page-header';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { buildHref } from '@/shared/lib/pagination';
import { schemaParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Metrics' };

interface MetricsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const { schema } = schemaParamsSchema.parse(await searchParams);

  return (
    <>
      <PageHeader title="Metrics" description="Values measured for every analysis. Open a metric to edit or disable it." />
      <SchemaTabs schema={schema} href={(value) => buildHref('/metrics', { schema: value })} />
      <MetricListView schema={schema} />
    </>
  );
}
