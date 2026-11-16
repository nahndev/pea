'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { useUser } from '../hooks/use-users';
import { UserDeleteSection } from './user-delete-section';
import { UserForm } from './user-form';

interface UserDetailViewProps {
  userId: string;
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const { data, error } = useUser(userId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={data.name} description={`${data.username} · ${data.group.name}`}>
        <Breadcrumbs entries={[{ label: 'Users', href: '/users' }, { label: data.name }]} />
      </PageHeader>
      <UserForm key={data.updatedAt} user={data} />
      <UserDeleteSection user={data} />
    </div>
  );
}
