'use client';

import { DatabaseConnectionMode } from '@tomato/constants';
import type { DatabaseView } from '@tomato/types';
import { Button, Input, Label } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { DATABASE_FIELD_ERRORS } from '../databases.constants';
import { buildDatabaseSchema, type DatabaseInput } from '../databases.schemas';
import { useUpdateDatabase } from '../hooks/use-databases';
import { DatabaseConnectionFields } from './database-connection-fields';
import { InspectDatabaseDialog } from './inspect-database-dialog';

interface DatabaseFormProps {
  database?: DatabaseView;
}

export function DatabaseForm({ database }: DatabaseFormProps) {
  const router = useRouter();
  const { mutate, isPending, error: requestError } = useUpdateDatabase(database?.id ?? '');
  const [connectionMode, setConnectionMode] = useState<DatabaseConnectionMode>(database?.connection.mode ?? DatabaseConnectionMode.FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [inspectInput, setInspectInput] = useState<DatabaseInput | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);
    const schema = buildDatabaseSchema(database?.connection.mode === DatabaseConnectionMode.URL);
    const parsed = schema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), connectionMode });
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map(({ path, message }) => [String(path[0]), DATABASE_FIELD_ERRORS[message] ?? DATABASE_FIELD_ERRORS.invalid])),
      );
      return;
    }
    setFieldErrors({});
    if (!database) {
      setInspectInput(parsed.data);
      return;
    }
    mutate(parsed.data, { onSuccess: () => setIsSaved(true) });
  };

  return (
    <form onSubmit={submit} onChange={() => setIsSaved(false)} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={database?.name} placeholder="Shop — staging" maxLength={255} aria-invalid={Boolean(fieldErrors.name)} aria-describedby="name-error" required />
        <FieldError id="name-error" message={fieldErrors.name} />
      </div>
      <DatabaseConnectionFields mode={connectionMode} onModeChange={setConnectionMode} fieldErrors={fieldErrors} connection={database?.connection} />
      {requestError ? <ErrorState error={requestError} title="Unable to save database" /> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Connecting…' : database ? 'Save' : 'Inspect database'}
        </Button>
        {database ? null : (
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
      <InspectDatabaseDialog input={inspectInput} onClose={() => setInspectInput(null)} />
    </form>
  );
}
