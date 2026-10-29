import { Alert, AlertDescription, AlertTitle } from '@tomato/ui';
import { AlertCircleIcon } from 'lucide-react';
import { getApiError } from '../lib/api-client';
import { getErrorMessage } from '../lib/error-messages';

interface ErrorStateProps {
  error: unknown;
  title?: string;
}

export function ErrorState({ error, title = 'Unable to load data' }: ErrorStateProps) {
  const { code } = getApiError(error);
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{getErrorMessage(code)}</AlertDescription>
    </Alert>
  );
}
