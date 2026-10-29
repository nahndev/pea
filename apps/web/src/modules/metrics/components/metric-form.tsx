'use client';

import type { MetricView } from '@tomato/types';
import { Button, Input, Label } from '@tomato/ui';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useUpdateMetric } from '../hooks/use-metrics';
import { updateMetricSchema } from '../metrics.schemas';

const FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
};

interface MetricFormProps {
  metric: MetricView;
}

export function MetricForm({ metric }: MetricFormProps) {
  const { mutate, isPending, error: requestError } = useUpdateMetric(metric.id);
  const [isActive, setIsActive] = useState(metric.isActive);
  const [descriptionError, setDescriptionError] = useState<string>();
  const [isSaved, setIsSaved] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);
    const parsed = updateMetricSchema.safeParse({ description: new FormData(event.currentTarget).get('description'), isActive });
    if (!parsed.success) {
      setDescriptionError(FIELD_ERRORS[parsed.error.issues[0]?.message ?? ''] ?? FIELD_ERRORS.required);
      return;
    }
    setDescriptionError(undefined);
    mutate(parsed.data, { onSuccess: () => setIsSaved(true) });
  };

  return (
    <form
      onSubmit={submit}
      onChange={() => setIsSaved(false)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <input id="is-active" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        <Label htmlFor="is-active">Active</Label>
        <span className="text-xs text-muted-foreground">A disabled metric is not measured in new analyses and cannot get new conditions.</span>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={metric.description}
          maxLength={255}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby="description-error"
          required
        />
        <p id="description-error" role={descriptionError ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
          {descriptionError}
        </p>
      </div>
      {requestError ? <ErrorState error={requestError} title="Unable to save metric" /> : null}
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
