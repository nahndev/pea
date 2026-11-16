'use client';

import type { Permission } from '@tomato/constants';
import type { GroupView } from '@tomato/types';
import { Button, Input, Label } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { GROUP_FIELD_ERRORS } from '../groups.constants';
import { groupSchema } from '../groups.schemas';
import { useCreateGroup, useUpdateGroup } from '../hooks/use-groups';
import { GroupPermissionFields } from './group-permission-fields';

interface GroupFormProps {
  group?: GroupView;
}

export function GroupForm({ group }: GroupFormProps) {
  const router = useRouter();
  const create = useCreateGroup();
  const update = useUpdateGroup(group?.id ?? '');
  const { isPending, error: requestError } = group ? update : create;
  const [permissions, setPermissions] = useState<Permission[]>(group?.permissions ?? []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);
    const parsed = groupSchema.safeParse({ name: new FormData(event.currentTarget).get('name'), permissions });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map(({ path, message }) => [String(path[0]), GROUP_FIELD_ERRORS[message] ?? GROUP_FIELD_ERRORS.invalid])));
      return;
    }
    setFieldErrors({});
    if (group) update.mutate(parsed.data, { onSuccess: () => setIsSaved(true) });
    else create.mutate(parsed.data, { onSuccess: ({ id }) => router.push(`/groups/${id}`) });
  };

  const changePermissions = (next: Permission[]) => {
    setIsSaved(false);
    setPermissions(next);
  };

  return (
    <form onSubmit={submit} onChange={() => setIsSaved(false)} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={group?.name} placeholder="Analysts" maxLength={255} aria-invalid={Boolean(fieldErrors.name)} aria-describedby="name-error" required />
        <FieldError id="name-error" message={fieldErrors.name} />
      </div>
      <GroupPermissionFields value={permissions} onChange={changePermissions} disabled={isPending} />
      <FieldError id="permissions-error" message={fieldErrors.permissions} />
      {requestError ? <ErrorState error={requestError} title="Unable to save group" /> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : group ? 'Save' : 'Add group'}
        </Button>
        {group ? null : (
          <Button type="button" variant="ghost" intent="neutral" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        )}
        {isSaved ? (
          <span role="status" className="text-xs text-muted-foreground">
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
