'use client';

import { Button, Input, Label } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { DEFAULT_ANALYSIS_SCHEMA } from '@/shared/lib/analysis-schema.constants';
import { branchSchemaHref } from '../branch-schema-href';
import { createBranchSchema } from '../branches.schemas';
import { useCreateBranch } from '../hooks/use-branches';

const FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
};

export function CreateBranchForm() {
  const router = useRouter();
  const { mutate, isPending, error: requestError } = useCreateBranch();
  const [nameError, setNameError] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createBranchSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setNameError(FIELD_ERRORS[parsed.error.issues[0]?.message ?? ''] ?? FIELD_ERRORS.required);
      return;
    }
    setNameError(undefined);
    mutate(parsed.data, { onSuccess: ({ id }) => router.push(branchSchemaHref(id, DEFAULT_ANALYSIS_SCHEMA)) });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Create branch" description="Register a branch so analyses can be attached to it.">
        <Breadcrumbs entries={[{ label: 'Branches', href: '/branches' }, { label: 'Create branch' }]} />
      </PageHeader>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Branch name</Label>
          <Input id="name" name="name" placeholder="feat/my-branch" maxLength={255} aria-invalid={Boolean(nameError)} aria-describedby="name-error" required />
          <p id="name-error" role={nameError ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
            {nameError}
          </p>
        </div>
        {requestError ? <ErrorState error={requestError} title="Unable to create branch" /> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create branch'}
          </Button>
          <Button type="button" variant="ghost" intent="neutral" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
