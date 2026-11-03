'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useIssues } from '../hooks/use-issues';
import { ISSUE_SUBJECT_STATUS_STYLE, RULE_TYPE_LABEL } from '../issues.constants';
import type { IssueListParams } from '../issues.schemas';
import { IssueFilters } from './issue-filters';

interface IssueListViewProps {
  analysisId: string;
  params: IssueListParams;
}

export function IssueListView({ analysisId, params }: IssueListViewProps) {
  const router = useRouter();
  const { data, error, isPending } = useIssues(analysisId, params);
  const pathname = `/analyses/${analysisId}/issues`;
  const hasFilters = Boolean(params.status || params.severity || params.ruleType);

  return (
    <section className="flex flex-col gap-4">
      <IssueFilters analysisId={analysisId} params={params} />
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data && data.items.length === 0 ? (
        <EmptyState title={hasFilters ? 'No issue matches these filters' : 'No issues found'}>
          {hasFilters ? 'Clear a filter to see more.' : 'This analysis did not raise any issue.'}
        </EmptyState>
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card shadow-card">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Severity</TableHead>
                  <TableHead className="w-1/3">Rule</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-20 text-right">Count</TableHead>
                  <TableHead className="w-44">Raised</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((issue) => (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer"
                    onClick={(event) => {
                      if (!(event.target as HTMLElement).closest('a')) router.push(`${pathname}/${issue.id}`);
                    }}
                  >
                    <TableCell>
                      <StatusBadge style={SEVERITY_STYLE[issue.severity]} />
                    </TableCell>
                    <TableCell>
                      <p className="truncate font-medium" title={RULE_TYPE_LABEL[issue.rule.type]}>
                        {RULE_TYPE_LABEL[issue.rule.type]}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground" title={issue.subject.description}>
                        {issue.subject.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link
                        href={`${pathname}/${issue.id}`}
                        title={issue.description ?? issue.rule.description}
                        className="block truncate hover:underline focus-ring rounded-sm"
                      >
                        {issue.description ?? issue.rule.description}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge style={ISSUE_SUBJECT_STATUS_STYLE[issue.issueSubject.status]} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{issue.issueCount}</TableCell>
                    <TableCell className="truncate text-muted-foreground">{formatDateTime(issue.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={params.page}
            total={data.total}
            buildHref={(target) => buildHref(pathname, { page: target > 1 ? target : undefined, status: params.status, severity: params.severity, ruleType: params.ruleType })}
          />
        </>
      ) : null}
    </section>
  );
}
