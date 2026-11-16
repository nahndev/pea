'use client';

import { Button, Input, Label } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { safeNextPath } from '@/shared/lib/login';
import { LOGIN_FIELD_ERRORS } from '../auth.constants';
import { loginSchema } from '../auth.schemas';
import { useLogin } from '../hooks/use-auth';

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const { mutate, isPending, error: requestError } = useLogin();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map(({ path, message }) => [String(path[0]), LOGIN_FIELD_ERRORS[message] ?? LOGIN_FIELD_ERRORS.required])));
      return;
    }
    setFieldErrors({});
    mutate(parsed.data, { onSuccess: () => router.replace(safeNextPath(next)) });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" autoFocus aria-invalid={Boolean(fieldErrors.username)} aria-describedby="username-error" required />
        <FieldError id="username-error" message={fieldErrors.username} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby="password-error" required />
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
      {requestError ? <ErrorState error={requestError} title="Unable to sign in" /> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
