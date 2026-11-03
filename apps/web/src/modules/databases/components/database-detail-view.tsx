'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { useDatabase } from '../hooks/use-databases';
import { DatabaseDeleteSection } from './database-delete-section';
import { DatabaseForm } from './database-form';

interface DatabaseDetailViewProps {
  databaseId: string;
}

export function DatabaseDetailView({ databaseId }: DatabaseDetailViewProps) {
  const { data, error } = useDatabase(databaseId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={data.name} description={`${data.address} · Changes apply to analyses run from now on, including re-analyses.`}>
        <Breadcrumbs entries={[{ label: 'Databases', href: '/databases' }, { label: data.name }]} />
      </PageHeader>
      <DatabaseForm key={data.updatedAt} database={data} />
      <DatabaseDeleteSection database={data} />
    </div>
  );
}
