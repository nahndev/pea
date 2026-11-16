import { ErrorCode } from '@tomato/constants';
import { Alert, AlertDescription, AlertTitle } from '@tomato/ui';
import { LockIcon } from 'lucide-react';
import { getErrorMessage } from '@/shared/lib/error-messages';

export function ForbiddenState() {
  return (
    <Alert>
      <LockIcon />
      <AlertTitle>No access</AlertTitle>
      <AlertDescription>{getErrorMessage(ErrorCode.FORBIDDEN)} Ask an administrator to add the permission to your group.</AlertDescription>
    </Alert>
  );
}
