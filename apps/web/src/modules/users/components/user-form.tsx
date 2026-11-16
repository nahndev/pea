'use client';

import type { UserView } from '@tomato/types';
import { Button, Input, Label } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { GroupSelect } from '@/modules/groups';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { useCreateUser, useUpdateUser } from '../hooks/use-users';
import { PASSWORD_MAX_LENGTH, USER_FIELD_ERRORS, USERNAME_MAX_LENGTH } from '../users.constants';
import { buildUserSchema } from '../users.schemas';

interface UserFormProps {
  user?: UserView;
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const create = useCreateUser();
  const update = useUpdateUser(user?.id ?? '');
  const { isPending, error: requestError } = user ? update : create;
  const [groupId, setGroupId] = useState(user?.group.id ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);
    const parsed = buildUserSchema(!user).safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), groupId });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map(({ path, message }) => [String(path[0]), USER_FIELD_ERRORS[message] ?? USER_FIELD_ERRORS.invalid])));
      return;
    }
    setFieldErrors({});
    if (user) update.mutate(parsed.data, { onSuccess: () => setIsSaved(true) });
    else create.mutate(parsed.data, { onSuccess: ({ id }) => router.push(`/users/${id}`) });
  };

  const changeGroup = (next: string) => {
    setIsSaved(false);
    setGroupId(next);
  };

  return (
    <form onSubmit={submit} onChange={() => setIsSaved(false)} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={user?.name} placeholder="Ada Lovelace" maxLength={255} aria-invalid={Boolean(fieldErrors.name)} aria-describedby="name-error" required />
        <FieldError id="name-error" message={fieldErrors.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={user?.username}
          placeholder="ada"
          autoComplete="off"
          maxLength={USERNAME_MAX_LENGTH}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby="username-hint username-error"
          required
        />
        <p id="username-hint" className="text-xs text-muted-foreground">
          Used to sign in. Lowercase letters, digits, dots, dashes or underscores.
        </p>
        <FieldError id="username-error" message={fieldErrors.username} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{user ? 'New password' : 'Password'}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby="password-hint password-error"
          required={!user}
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          {user ? 'Leave empty to keep the current password. A new password signs the user out everywhere.' : 'Share it with the user privately.'}
        </p>
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
      <GroupSelect value={groupId} onChange={changeGroup} error={fieldErrors.groupId} disabled={isPending} />
      {requestError ? <ErrorState error={requestError} title="Unable to save user" /> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : user ? 'Save' : 'Add user'}
        </Button>
        {user ? null : (
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
