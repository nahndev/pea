'use client';

import { Skeleton } from '@tomato/ui';
import Link from 'next/link';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { formatDateTime } from '@/shared/lib/format';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useIssue } from '../hooks/use-issues';
import { RULE_TYPE_LABEL } from '../issues.constants';
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

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <Breadcrumbs entries={[{ label: 'Issues', href: `/analyses/${analysisId}/issues` }, { label: ruleLabel }]} />
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card">
        <p className="text-sm">{data.description ?? rule.description}</p>
        <dl className="grid grid-cols-[max-content_1fr] items-center gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Rule</dt>
          <dd>
            <Link href={`/rules/${rule.id}`} className="font-medium hover:underline focus-ring rounded-sm">
              {ruleLabel}
            </Link>
          </dd>
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="break-all font-mono text-xs">{subject.description}</dd>
          <dt className="text-muted-foreground">Severity</dt>
          <dd>
            <StatusBadge style={SEVERITY_STYLE[data.severity]} />
          </dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <IssueSubjectStatusSelect issueSubject={issueSubject} />
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
