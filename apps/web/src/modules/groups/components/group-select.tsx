'use client';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@tomato/ui';
import Link from 'next/link';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { useGroups } from '../hooks/use-groups';

interface GroupSelectProps {
  value: string;
  onChange: (groupId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function GroupSelect({ value, onChange, error, disabled }: GroupSelectProps) {
  const { data, error: requestError } = useGroups();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="groupId">Group</Label>
      {requestError ? <ErrorState error={requestError} /> : null}
      {!data && !requestError ? <Skeleton className="h-9 w-full" /> : null}
      {data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No group yet.{' '}
          <Link href="/groups/new" className="text-foreground underline focus-ring rounded-sm">
            Add a group
          </Link>{' '}
          first.
        </p>
      ) : null}
      {data && data.length > 0 ? (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id="groupId" className="w-full" aria-invalid={Boolean(error)} aria-describedby="groupId-error">
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            {data.map(({ id, name }) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <FieldError id="groupId-error" message={error} />
    </div>
  );
}
