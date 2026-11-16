'use client';

import type { GroupView } from '@tomato/types';
import { Button } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useDeleteGroup } from '../hooks/use-groups';

interface GroupDeleteSectionProps {
  group: GroupView;
}

export function GroupDeleteSection({ group }: GroupDeleteSectionProps) {
  const router = useRouter();
  const { mutate, isPending, error } = useDeleteGroup(group.id);
  const [isConfirming, setIsConfirming] = useState(false);
  const isInUse = group.users.length > 0;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-card">
      <h2 className="text-sm font-medium">Delete group</h2>
      <p className="text-sm text-muted-foreground">
        {isInUse ? 'Move its users to another group first.' : 'Removes the group. This cannot be undone.'}
      </p>
      {error ? <ErrorState error={error} title="Unable to delete group" /> : null}
      <div className="flex gap-3">
        {isConfirming ? (
          <>
            <Button intent="danger" size="sm" onClick={() => mutate(undefined, { onSuccess: () => router.push('/groups') })} disabled={isPending}>
              {isPending ? 'Deleting…' : `Delete ${group.name}`}
            </Button>
            <Button variant="ghost" intent="neutral" size="sm" onClick={() => setIsConfirming(false)} disabled={isPending}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outlined" intent="danger" size="sm" onClick={() => setIsConfirming(true)} disabled={isInUse}>
            Delete
          </Button>
        )}
      </div>
    </section>
  );
}
