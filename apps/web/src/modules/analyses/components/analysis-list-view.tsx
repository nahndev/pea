'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import type { AnalysisSchema } from '@tomato/constants';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { useBranchAnalyses } from '../hooks/use-analyses';
import { GateStatusBadge, ResultStatusBadge } from './analysis-status-badges';

interface AnalysisListViewProps {
  branchId: string;
  schema: AnalysisSchema;
  page: number;
}

const linkClass = 'text-sm underline-offset-4 hover:underline focus-ring rounded-sm';

export function AnalysisListView({ branchId, schema, page }: AnalysisListViewProps) {
  const { data, error, isPending } = useBranchAnalyses(branchId, schema, page);
  const pathname = `/branches/${branchId}/schemas/${schema.toLowerCase()}`;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="analyses-heading">
      <h2 id="analyses-heading" className="text-lg font-semibold">
        Analyses
      </h2>
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data && data.items.length === 0 ? <EmptyState title="No analysis for this branch yet" /> : null}
      {data && data.items.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merge request</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(analysis.createdAt)}</TableCell>
                    <TableCell>{analysis.mergeRequestIid ? `!${analysis.mergeRequestIid}` : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{analysis.latestResult ? <ResultStatusBadge status={analysis.latestResult.status} /> : <span className="text-muted-foreground">Pending</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{analysis.latestResult?.issueCount ?? '—'}</TableCell>
                    <TableCell>
                      <GateStatusBadge status={analysis.latestResult?.gateStatus ?? null} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="flex gap-3">
                        <Link href={`/analyses/${analysis.id}/issues`} className={linkClass}>
                          Issues
                        </Link>
                        <Link href={`/analyses/${analysis.id}/metrics`} className={linkClass}>
                          Metrics
                        </Link>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar page={page} total={data.total} buildHref={(target) => buildHref(pathname, { page: target > 1 ? target : undefined })} />
        </>
      ) : null}
    </section>
  );
}
