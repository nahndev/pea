import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { PageHeader } from '@/shared/components/page-header';
import { UserForm } from './user-form';

export function UserCreateView() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Add user" description="The user signs in with this username and password and gets the permissions of the group.">
        <Breadcrumbs entries={[{ label: 'Users', href: '/users' }, { label: 'Add user' }]} />
      </PageHeader>
      <UserForm />
    </div>
  );
}
