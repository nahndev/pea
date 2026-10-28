import { Alert, AlertDescription, AlertTitle } from '@tomato/ui';
import { AlertCircleIcon } from 'lucide-react';
import { getApiError } from '../lib/api-client';
import { getErrorMessage } from '../lib/error-messages';

interface ErrorStateProps {
  error: unknown;
}

export function ErrorState({ error }: ErrorStateProps) {
  const { code } = getApiError(error);
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Unable to load data</AlertTitle>
      <AlertDescription>{getErrorMessage(code)}</AlertDescription>
    </Alert>
  );
}
