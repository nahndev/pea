'use client';

import { Skeleton } from '@tomato/ui';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { ANALYSIS_SCHEMA_LABEL } from '@/shared/lib/analysis-schema.constants';
import { METRIC_LABEL } from '@/modules/metrics';
import { useCondition } from '../hooks/use-conditions';
import { ConditionForm } from './condition-form';

interface ConditionDetailViewProps {
  conditionId: string;
}

export function ConditionDetailView({ conditionId }: ConditionDetailViewProps) {
  const { data, error } = useCondition(conditionId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  const title = `${ANALYSIS_SCHEMA_LABEL[data.schema]} · ${METRIC_LABEL[data.metric.type]}`;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={title} description="Changes apply to analyses run from now on. Past results keep the condition they were checked against.">
        <Breadcrumbs entries={[{ label: 'Conditions', href: '/conditions' }, { label: title }]} />
      </PageHeader>
      <ConditionForm key={`${data.operator}:${data.threshold}:${data.isActive}`} condition={data} />
    </div>
  );
}
