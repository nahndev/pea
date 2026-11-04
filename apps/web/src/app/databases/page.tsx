import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DatabaseListView, databaseListParamsSchema } from '@/modules/databases';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Databases' };

interface DatabasesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DatabasesPage({ searchParams }: DatabasesPageProps) {
  const params = databaseListParamsSchema.parse(await searchParams);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Databases" description="Saved PostgreSQL connections picked by database analyses. Open a database to edit it." />
        <Link href="/databases/new" className={buttonVariants({ size: 'sm' })}>
          Add database
        </Link>
      </div>
      <DatabaseListView params={params} />
    </>
  );
}
