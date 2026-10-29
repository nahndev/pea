'use client';

import { MetricConditionOperator } from '@tomato/constants';
import type { MetricConditionView } from '@tomato/types';
import { Button, Label } from '@tomato/ui';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { METRIC_UNIT_LABEL } from '@/modules/metrics';
import { updateConditionSchema } from '../conditions.schemas';
import { useUpdateCondition } from '../hooks/use-conditions';
import { ConditionLimitFields } from './condition-limit-fields';

interface ConditionFormProps {
  condition: MetricConditionView;
}

export function ConditionForm({ condition }: ConditionFormProps) {
  const { mutate, isPending, error: requestError } = useUpdateCondition(condition.id);
  const [operator, setOperator] = useState<MetricConditionOperator>(condition.operator);
  const [isActive, setIsActive] = useState(condition.isActive);
  const [thresholdError, setThresholdError] = useState<string>();
  const [isSaved, setIsSaved] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);
    const parsed = updateConditionSchema.safeParse({
      operator,
      isActive,
      threshold: new FormData(event.currentTarget).get('threshold'),
    });
    if (!parsed.success) {
      setThresholdError('Enter a number of 0 or more.');
      return;
    }
    setThresholdError(undefined);
    mutate(parsed.data, { onSuccess: () => setIsSaved(true) });
  };

  return (
    <form
      onSubmit={submit}
      onChange={() => setIsSaved(false)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card"
    >
      <p className="text-sm text-muted-foreground">The quality gate fails a result when its value matches this condition.</p>
      <div className="flex items-center gap-2">
        <input
          id="is-active"
          type="checkbox"
          checked={isActive}
          onChange={(event) => {
            setIsActive(event.target.checked);
            setIsSaved(false);
          }}
        />
        <Label htmlFor="is-active">Active</Label>
        <span className="text-xs text-muted-foreground">A disabled condition is not checked in new analyses.</span>
      </div>
      <ConditionLimitFields
        operator={operator}
        onOperatorChange={(value) => {
          setOperator(value);
          setIsSaved(false);
        }}
        unitLabel={METRIC_UNIT_LABEL[condition.metric.unit]}
        defaultThreshold={condition.threshold}
        error={thresholdError}
      />
      {requestError ? <ErrorState error={requestError} title="Unable to save condition" /> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        {isSaved ? (
          <span role="status" className="text-xs text-muted-foreground">
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
