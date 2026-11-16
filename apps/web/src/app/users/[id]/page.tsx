import type { Metadata } from 'next';
import { UserDetailView } from '@/modules/users';

export const metadata: Metadata = { title: 'User' };

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;

  return <UserDetailView userId={id} />;
}
