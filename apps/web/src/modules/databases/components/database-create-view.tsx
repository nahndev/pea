import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { PageHeader } from '@/shared/components/page-header';
import { DatabaseForm } from './database-form';

export function DatabaseCreateView() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Add database" description="Save a PostgreSQL connection once and pick it for every database analysis.">
        <Breadcrumbs entries={[{ label: 'Databases', href: '/databases' }, { label: 'Add database' }]} />
      </PageHeader>
      <DatabaseForm />
    </div>
  );
}
