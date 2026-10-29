import type { Metadata } from 'next';
import { ConditionDetailView } from '@/modules/conditions';

export const metadata: Metadata = { title: 'Condition' };

interface ConditionPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConditionPage({ params }: ConditionPageProps) {
  const { id } = await params;

  return <ConditionDetailView conditionId={id} />;
}
