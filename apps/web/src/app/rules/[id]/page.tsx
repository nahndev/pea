import type { Metadata } from 'next';
import { RuleDetailView } from '@/modules/rules';

export const metadata: Metadata = { title: 'Rule' };

interface RulePageProps {
  params: Promise<{ id: string }>;
}

export default async function RulePage({ params }: RulePageProps) {
  const { id } = await params;

  return <RuleDetailView ruleId={id} />;
}
