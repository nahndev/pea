'use client';

import type { Repo } from '@tomato/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useDeleteRepo } from '../hooks/use-repos';

interface DeleteRepoDialogProps {
  repo: Repo;
}

export function DeleteRepoDialog({ repo }: DeleteRepoDialogProps) {
  const router = useRouter();
  const { mutate, isPending, error, reset } = useDeleteRepo(repo);
  const [isOpen, setIsOpen] = useState(false);

  const changeOpen = (isNextOpen: boolean) => {
    if (isPending) return;
    if (!isNextOpen) reset();
    setIsOpen(isNextOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outlined" intent="danger" size="sm">
          Delete repo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete repo</DialogTitle>
          <DialogDescription>
            Deletes <span className="font-medium text-foreground">{repo.name}</span> with all its analyses, results, issues and uploaded
            logs. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <ErrorState error={error} title="Unable to delete repo" /> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" intent="neutral" onClick={() => changeOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" intent="danger" onClick={() => mutate(undefined, { onSuccess: () => router.push('/repos') })} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete repo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
