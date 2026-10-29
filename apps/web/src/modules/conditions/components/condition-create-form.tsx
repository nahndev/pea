'use client';

import { MetricConditionOperator } from '@tomato/constants';
import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '@/modules/metrics';
import { createConditionSchema } from '../conditions.schemas';
import { useConditions, useCreateCondition, useMetricOptions, useQualityGates } from '../hooks/use-conditions';
import { ConditionLimitFields } from './condition-limit-fields';

export function ConditionCreateForm() {
  const router = useRouter();
  const gates = useQualityGates();
  const metrics = useMetricOptions();
  const conditions = useConditions();
  const { mutate, isPending, error: requestError } = useCreateCondition();
  const [gateId, setGateId] = useState<string>();
  const [metricId, setMetricId] = useState<string>();
  const [operator, setOperator] = useState<MetricConditionOperator>(MetricConditionOperator.GT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedGateId = gateId ?? gates.data?.[0]?.id;
  const usedMetricIds = new Set(
    (conditions.data ?? []).filter(({ qualityGate }) => qualityGate.id === selectedGateId).map(({ metric }) => metric.id),
  );
  const selectedMetric = metrics.data?.find(({ id }) => id === metricId);
  const loadError = gates.error ?? metrics.error ?? conditions.error;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createConditionSchema.safeParse({
      qualityGateId: selectedGateId ?? '',
      metricId: metricId ?? '',
      operator,
      threshold: new FormData(event.currentTarget).get('threshold'),
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(({ path }) => [String(path[0]), 'Check this field.'])));
      return;
    }
    setErrors({});
    mutate(parsed.data, { onSuccess: ({ id }) => router.push(`/conditions/${id}`) });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Create condition" description="Add a limit to a quality gate. A gate has one condition per metric, and a new condition is active.">
        <Breadcrumbs entries={[{ label: 'Conditions', href: '/conditions' }, { label: 'Create condition' }]} />
      </PageHeader>
      {loadError ? <ErrorState error={loadError} /> : null}
      {!loadError && (!gates.data || !metrics.data || !conditions.data) ? <Skeleton className="h-40 w-full" /> : null}
      {gates.data && metrics.data && conditions.data ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quality-gate">Quality gate</Label>
            <Select
              value={selectedGateId}
              onValueChange={(value) => {
                setGateId(value);
                setMetricId(undefined);
              }}
            >
              <SelectTrigger id="quality-gate" className="w-64" aria-invalid={Boolean(errors.qualityGateId)}>
                <SelectValue placeholder="Select a quality gate" />
              </SelectTrigger>
              <SelectContent>
                {gates.data.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="metric">Metric</Label>
            <Select value={metricId} onValueChange={setMetricId}>
              <SelectTrigger id="metric" className="w-64" aria-invalid={Boolean(errors.metricId)} aria-describedby="metric-error">
                <SelectValue placeholder="Select a metric" />
              </SelectTrigger>
              <SelectContent>
                {metrics.data.map(({ id, type }) => (
                  <SelectItem key={id} value={id} disabled={usedMetricIds.has(id)}>
                    {METRIC_LABEL[type]}
                    {usedMetricIds.has(id) ? ' (already has a condition)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="metric-error" role={errors.metricId ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
              {errors.metricId ? 'Select a metric.' : null}
            </p>
          </div>
          <ConditionLimitFields
            operator={operator}
            onOperatorChange={setOperator}
            unitLabel={selectedMetric ? METRIC_UNIT_LABEL[selectedMetric.unit] : undefined}
            error={errors.threshold ? 'Enter a number of 0 or more.' : undefined}
          />
          {requestError ? <ErrorState error={requestError} title="Unable to create condition" /> : null}
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create condition'}
            </Button>
            <Button type="button" variant="ghost" intent="neutral" onClick={() => router.back()} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
