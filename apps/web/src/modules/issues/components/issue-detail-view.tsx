'use client';

import { Permission } from '@tomato/constants';
import { Skeleton } from '@tomato/ui';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { formatDateTime } from '@/shared/lib/format';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useIssue } from '../hooks/use-issues';
import { ISSUE_SUBJECT_STATUS_STYLE, RULE_TYPE_LABEL } from '../issues.constants';
import { IssueCopyButton } from './issue-copy-button';
import { IssueSubjectStatusSelect } from './issue-subject-status-select';

interface IssueDetailViewProps {
  analysisId: string;
  issueId: string;
}

export function IssueDetailView({ analysisId, issueId }: IssueDetailViewProps) {
  const { data, error } = useIssue(issueId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-40 w-full max-w-2xl" />;

  const { rule, subject, issueSubject } = data;
  const ruleLabel = RULE_TYPE_LABEL[rule.type];
  const detail = data.description ?? rule.description;

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumbs entries={[{ label: 'Issues', href: `/analyses/${analysisId}/issues` }, { label: ruleLabel }]} />
        <IssueCopyButton text={`[${ruleLabel}] ${subject.description} - ${detail}`} />
      </div>
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card">
        <p className="text-sm">{detail}</p>
        <dl className="grid grid-cols-[max-content_1fr] items-center gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Rule</dt>
          <dd>
            <RequirePermission permission={Permission.MANAGER_RULE} fallback={<span className="font-medium">{ruleLabel}</span>}>
              <Link href={`/rules/${rule.id}`} className="font-medium hover:underline focus-ring rounded-sm">
                {ruleLabel}
              </Link>
            </RequirePermission>
          </dd>
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="break-all font-mono text-xs">{subject.description}</dd>
          <dt className="text-muted-foreground">Severity</dt>
          <dd>
            <StatusBadge style={SEVERITY_STYLE[data.severity]} />
          </dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <RequirePermission permission={Permission.BRANCH_ANALYSIS} fallback={<StatusBadge style={ISSUE_SUBJECT_STATUS_STYLE[issueSubject.status]} />}>
              <IssueSubjectStatusSelect issueSubject={issueSubject} />
            </RequirePermission>
          </dd>
          <dt className="text-muted-foreground">Count</dt>
          <dd className="tabular-nums">{data.issueCount}</dd>
          <dt className="text-muted-foreground">Raised</dt>
          <dd className="text-muted-foreground">{formatDateTime(data.createdAt)}</dd>
        </dl>
      </div>
    </section>
  );
}
