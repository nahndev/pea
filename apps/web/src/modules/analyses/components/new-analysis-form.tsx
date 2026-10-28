'use client';

import { Button, Input, Label } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { LOG_FILE_FIELDS, MAX_LOG_FILE_SIZE } from '../analyses.constants';
import { createAnalysisSchema } from '../analyses.schemas';
import { useCreateAnalysis } from '../hooks/use-analyses';

interface NewAnalysisFormProps {
  branch?: string;
}

const FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
  invalid: 'Enter a positive whole number.',
  empty: 'The file is empty.',
  too_large: `The file must be at most ${MAX_LOG_FILE_SIZE / 1024 / 1024} MB.`,
  file_required: 'Attach at least one log file.',
};

export function NewAnalysisForm({ branch = '' }: NewAnalysisFormProps) {
  const router = useRouter();
  const { mutate, isPending, error: requestError } = useCreateAnalysis();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(
      [...form.entries()].filter(([, value]) => !(value instanceof File && value.size === 0 && value.name === '')),
    );
    const parsed = createAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map(({ path, message }) => [String(path[0]), FIELD_ERRORS[message] ?? FIELD_ERRORS.invalid])));
      return;
    }
    setFieldErrors({});
    mutate(parsed.data, { onSuccess: ({ id }) => router.push(`/analyses/${id}/issues`) });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="New analysis" description="Upload log files to analyse a branch. Results appear once processing finishes.">
        <Breadcrumbs entries={[{ label: 'Branches', href: '/branches' }, { label: 'New analysis' }]} />
      </PageHeader>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-2">
          <Label htmlFor="branch">Branch</Label>
          <Input id="branch" name="branch" defaultValue={branch} placeholder="feat/my-branch" maxLength={255} aria-invalid={Boolean(fieldErrors.branch)} aria-describedby="branch-error" required />
          <FieldError id="branch-error" message={fieldErrors.branch} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mergeRequestIid">Merge request number (optional)</Label>
          <Input id="mergeRequestIid" name="mergeRequestIid" type="number" inputMode="numeric" min={1} step={1} className="max-w-40" aria-invalid={Boolean(fieldErrors.mergeRequestIid)} aria-describedby="mergeRequestIid-error" />
          <FieldError id="mergeRequestIid-error" message={fieldErrors.mergeRequestIid} />
        </div>
        {LOG_FILE_FIELDS.map(({ name, label, hint }) => (
          <div key={name} className="flex flex-col gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} type="file" accept=".json,.jsonl,.ndjson,.log,.txt" aria-invalid={Boolean(fieldErrors[name])} aria-describedby={`${name}-hint ${name}-error`} />
            <p id={`${name}-hint`} className="text-xs text-muted-foreground">
              {hint}
            </p>
            <FieldError id={`${name}-error`} message={fieldErrors[name]} />
          </div>
        ))}
        {requestError ? <ErrorState error={requestError} /> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Uploading…' : 'Run analysis'}
          </Button>
          <Button type="button" variant="ghost" intent="neutral" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role={message ? 'alert' : undefined} className="min-h-0 text-xs text-danger empty:hidden">
      {message}
    </p>
  );
}
