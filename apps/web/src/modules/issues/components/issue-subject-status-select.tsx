'use client';

import { IssueSubjectStatus } from '@tomato/constants';
import type { IssueSubjectView } from '@tomato/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { getApiError } from '@/shared/lib/api-client';
import { getErrorMessage } from '@/shared/lib/error-messages';
import { useUpdateIssueSubject } from '../hooks/use-issues';
import { ISSUE_SUBJECT_STATUS_STYLE } from '../issues.constants';

interface IssueSubjectStatusSelectProps {
  issueSubject: IssueSubjectView;
}

export function IssueSubjectStatusSelect({ issueSubject }: IssueSubjectStatusSelectProps) {
  const { mutate, isPending, error } = useUpdateIssueSubject(issueSubject.id);

  return (
    <div className="flex flex-col gap-1">
      <Select value={issueSubject.status} onValueChange={(status) => mutate(status as IssueSubjectStatus)} disabled={isPending}>
        <SelectTrigger aria-label="Status" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(IssueSubjectStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {ISSUE_SUBJECT_STATUS_STYLE[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {getErrorMessage(getApiError(error).code)}
        </span>
      ) : null}
    </div>
  );
}
