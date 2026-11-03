'use client';

import type { DatabaseView } from '@tomato/types';
import { Button } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useDeleteDatabase } from '../hooks/use-databases';

interface DatabaseDeleteSectionProps {
  database: DatabaseView;
}

export function DatabaseDeleteSection({ database }: DatabaseDeleteSectionProps) {
  const router = useRouter();
  const { mutate, isPending, error } = useDeleteDatabase(database.id);
  const [isConfirming, setIsConfirming] = useState(false);
  const isInUse = database.analysisCount > 0;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-card">
      <h2 className="text-sm font-medium">Delete database</h2>
      <p className="text-sm text-muted-foreground">
        {isInUse
          ? `Used by ${database.analysisCount} ${database.analysisCount === 1 ? 'analysis' : 'analyses'}, so it cannot be deleted.`
          : 'Removes the stored connection. This cannot be undone.'}
      </p>
      {error ? <ErrorState error={error} title="Unable to delete database" /> : null}
      <div className="flex gap-3">
        {isConfirming ? (
          <>
            <Button intent="danger" size="sm" onClick={() => mutate(undefined, { onSuccess: () => router.push('/databases') })} disabled={isPending}>
              {isPending ? 'Deleting…' : `Delete ${database.name}`}
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
