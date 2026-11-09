'use client';

import type { Branch } from '@tomato/types';
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
import { useDeleteBranch } from '../hooks/use-branches';

interface DeleteBranchDialogProps {
  branch: Branch;
}

export function DeleteBranchDialog({ branch }: DeleteBranchDialogProps) {
  const router = useRouter();
  const { mutate, isPending, error, reset } = useDeleteBranch(branch.id);
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
          Delete branch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete branch</DialogTitle>
          <DialogDescription>
            Deletes <span className="font-medium text-foreground">{branch.name}</span> with all its analyses, results, issues and uploaded
            logs. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <ErrorState error={error} title="Unable to delete branch" /> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" intent="neutral" onClick={() => changeOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" intent="danger" onClick={() => mutate(undefined, { onSuccess: () => router.push('/branches') })} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
