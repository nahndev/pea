import type { Metadata } from 'next';
import { GroupDetailView } from '@/modules/groups';

export const metadata: Metadata = { title: 'Group' };

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;

  return <GroupDetailView groupId={id} />;
}
