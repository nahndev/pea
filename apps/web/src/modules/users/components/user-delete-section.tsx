'use client';

import type { UserView } from '@tomato/types';
import { Button } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCurrentUser } from '@/modules/auth';
import { ErrorState } from '@/shared/components/error-state';
import { useDeleteUser } from '../hooks/use-users';

interface UserDeleteSectionProps {
  user: UserView;
}

export function UserDeleteSection({ user }: UserDeleteSectionProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { mutate, isPending, error } = useDeleteUser(user.id);
  const [isConfirming, setIsConfirming] = useState(false);
  const isSelf = currentUser?.id === user.id;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-card">
      <h2 className="text-sm font-medium">Delete user</h2>
      <p className="text-sm text-muted-foreground">
        {isSelf ? 'You cannot delete your own account.' : 'Removes the user and signs them out. This cannot be undone.'}
      </p>
      {error ? <ErrorState error={error} title="Unable to delete user" /> : null}
      <div className="flex gap-3">
        {isConfirming ? (
          <>
            <Button intent="danger" size="sm" onClick={() => mutate(undefined, { onSuccess: () => router.push('/users') })} disabled={isPending}>
              {isPending ? 'Deleting…' : `Delete ${user.name}`}
            </Button>
            <Button variant="ghost" intent="neutral" size="sm" onClick={() => setIsConfirming(false)} disabled={isPending}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outlined" intent="danger" size="sm" onClick={() => setIsConfirming(true)} disabled={isSelf}>
            Delete
          </Button>
        )}
      </div>
    </section>
  );
}
