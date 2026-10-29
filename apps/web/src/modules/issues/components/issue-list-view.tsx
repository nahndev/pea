'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useIssues } from '../hooks/use-issues';
import { ISSUE_STATUS_STYLE, RULE_TYPE_LABEL } from '../issues.constants';
import type { IssueListParams } from '../issues.schemas';
import { IssueFilters } from './issue-filters';

interface IssueListViewProps {
  analysisId: string;
  params: IssueListParams;
}

export function IssueListView({ analysisId, params }: IssueListViewProps) {
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <StatusBadge style={SEVERITY_STYLE[issue.severity]} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{RULE_TYPE_LABEL[issue.rule.type]}</TableCell>
                    <TableCell className="max-w-56 break-all font-mono text-xs">{issue.context.file}</TableCell>
                    <TableCell className="min-w-64 max-w-96 whitespace-normal text-muted-foreground">{issue.description ?? issue.rule.description}</TableCell>
                    <TableCell>
                      <StatusBadge style={ISSUE_STATUS_STYLE[issue.status]} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(issue.createdAt)}</TableCell>
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
