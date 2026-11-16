import type { Metadata } from 'next';
import { ChartSettingsView } from '@/modules/charts';
import { PageHeader } from '@/shared/components/page-header';
import { SchemaTabs } from '@/shared/components/schema-tabs';
import { buildHref } from '@/shared/lib/pagination';
import { schemaParamsSchema } from '@/shared/lib/schema-params';

export const metadata: Metadata = { title: 'Chart' };

interface ChartPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ChartPage({ searchParams }: ChartPageProps) {
  const { schema } = schemaParamsSchema.parse(await searchParams);

  return (
    <>
      <PageHeader
        title="Chart"
        description="Pick the metrics shown as cards on an analysis and the default lines of the trend chart."
      />
      <SchemaTabs schema={schema} href={(value) => buildHref('/charts', { schema: value })} />
      <ChartSettingsView schema={schema} />
    </>
  );
}
