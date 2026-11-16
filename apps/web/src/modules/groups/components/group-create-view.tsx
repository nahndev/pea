import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { PageHeader } from '@/shared/components/page-header';
import { GroupForm } from './group-form';

export function GroupCreateView() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Add group" description="Users get the permissions of their group.">
        <Breadcrumbs entries={[{ label: 'Groups', href: '/groups' }, { label: 'Add group' }]} />
      </PageHeader>
      <GroupForm />
    </div>
  );
}
