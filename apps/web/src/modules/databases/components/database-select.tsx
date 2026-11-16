'use client';

import { Permission } from '@tomato/constants';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@tomato/ui';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { useDatabases } from '../hooks/use-databases';

interface DatabaseSelectProps {
  value: string;
  onChange: (databaseId: string) => void;
  error?: string;
}

export function DatabaseSelect({ value, onChange, error }: DatabaseSelectProps) {
  const { data, error: requestError } = useDatabases();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="databaseId">Database</Label>
      {requestError ? <ErrorState error={requestError} /> : null}
      {!data && !requestError ? <Skeleton className="h-9 w-full" /> : null}
      {data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No database yet.{' '}
          <RequirePermission permission={Permission.MANAGER_DATABASE} fallback="Ask an administrator to add one.">
            <Link href="/databases/new" className="text-foreground underline focus-ring rounded-sm">
              Add a database
            </Link>{' '}
            first.
          </RequirePermission>
        </p>
      ) : null}
      {data && data.length > 0 ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="databaseId" className="w-full" aria-invalid={Boolean(error)} aria-describedby="databaseId-hint databaseId-error">
            <SelectValue placeholder="Select a database" />
          </SelectTrigger>
          <SelectContent>
            {data.map(({ id, name, address }) => (
              <SelectItem key={id} value={id}>
                {name}
                <span className="font-mono text-xs text-muted-foreground">{address}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <p id="databaseId-hint" className="text-xs text-muted-foreground">
        Connects read-only and counts the rows of every table the user can read.{' '}
        <RequirePermission permission={Permission.MANAGER_DATABASE}>
          <Link href="/databases" className="underline focus-ring rounded-sm">
            Manage databases
          </Link>
        </RequirePermission>
      </p>
      <FieldError id="databaseId-error" message={error} />
    </div>
  );
}
