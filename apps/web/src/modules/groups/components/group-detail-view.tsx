'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { useGroup } from '../hooks/use-groups';
import { GroupDeleteSection } from './group-delete-section';
import { GroupForm } from './group-form';
import { GroupMembers } from './group-members';

interface GroupDetailViewProps {
  groupId: string;
}

export function GroupDetailView({ groupId }: GroupDetailViewProps) {
  const { data, error } = useGroup(groupId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={data.name} description="Changes apply to every user of the group on their next request.">
        <Breadcrumbs entries={[{ label: 'Groups', href: '/groups' }, { label: data.name }]} />
      </PageHeader>
      <GroupForm key={data.updatedAt} group={data} />
      <GroupMembers users={data.users} />
      <GroupDeleteSection group={data} />
    </div>
  );
}
