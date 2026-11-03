import type { Metadata } from 'next';
import { DatabaseDetailView } from '@/modules/databases';

export const metadata: Metadata = { title: 'Database' };

interface DatabasePageProps {
  params: Promise<{ id: string }>;
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { id } = await params;

  return <DatabaseDetailView databaseId={id} />;
}
