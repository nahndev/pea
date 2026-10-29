'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { useRule } from '../hooks/use-rules';
import { RuleConfig } from './rule-config/rule-config';

interface RuleDetailViewProps {
  ruleId: string;
}

export function RuleDetailView({ ruleId }: RuleDetailViewProps) {
  const { data, error } = useRule(ruleId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={data.description} description={`${data.type} · Changes apply to analyses run from now on.`}>
        <Breadcrumbs entries={[{ label: 'Rules', href: '/rules' }, { label: data.description }]} />
      </PageHeader>
      <RuleConfig key={JSON.stringify(data.config)} rule={data} />
    </div>
  );
}
