'use client';

import { DatabaseCheckStatus } from '@tomato/constants';
import type { DatabaseCheck } from '@tomato/types';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Skeleton } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { getErrorMessage } from '@/shared/lib/error-messages';
import { DATABASE_CHECK_HINT, DATABASE_CHECK_LABEL, DATABASE_CHECK_STATUS_STYLE } from '../databases.constants';
import type { DatabaseInput } from '../databases.schemas';
import { useCreateDatabase, useDatabaseInspection } from '../hooks/use-databases';

interface InspectDatabaseDialogProps {
  /** Opens the dialog when set */
  input: DatabaseInput | null;
  onClose: () => void;
}

export function InspectDatabaseDialog({ input, onClose }: InspectDatabaseDialogProps) {
  const router = useRouter();
  const inspection = useDatabaseInspection(input);
  const create = useCreateDatabase();
  const checks = inspection.data?.checks;
  const canCreate = Boolean(checks) && !checks!.some(({ status }) => status === DatabaseCheckStatus.FAILED);

  const close = () => {
    create.reset();
    onClose();
  };

  return (
    <Dialog open={input !== null} onOpenChange={(isOpen) => (isOpen ? undefined : close())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Inspect database</DialogTitle>
          <DialogDescription>Failed checks block the creation. Warnings limit what the analysis can report.</DialogDescription>
        </DialogHeader>
        {inspection.error ? <ErrorState error={inspection.error} title="Unable to inspect database" /> : null}
        {inspection.isFetching ? (
          <Skeleton className="h-64 w-full" />
        ) : checks ? (
          <ul className="flex flex-col divide-y rounded-md border">
            {checks.map((check) => (
              <CheckItem key={check.type} check={check} />
            ))}
          </ul>
        ) : null}
        {create.error ? <ErrorState error={create.error} title="Unable to save database" /> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" intent="neutral" onClick={close} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="button" variant="outlined" intent="neutral" onClick={() => inspection.refetch()} disabled={inspection.isFetching || create.isPending}>
            Inspect again
          </Button>
          <Button
            type="button"
            onClick={() => create.mutate(input!, { onSuccess: () => router.push('/databases') })}
            disabled={!canCreate || inspection.isFetching || create.isPending}
          >
            {create.isPending ? 'Connecting…' : 'Create database'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckItem({ check: { type, status, value, code } }: { check: DatabaseCheck }) {
  const detail = status === DatabaseCheckStatus.FAILED ? code && getErrorMessage(code) : status === DatabaseCheckStatus.WARNING ? DATABASE_CHECK_HINT[type] : undefined;

  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium">
          {DATABASE_CHECK_LABEL[type]}
          {value ? <span className="ml-2 font-normal text-muted-foreground">{value}</span> : null}
        </span>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <StatusBadge style={DATABASE_CHECK_STATUS_STYLE[status]} />
    </li>
  );
}
