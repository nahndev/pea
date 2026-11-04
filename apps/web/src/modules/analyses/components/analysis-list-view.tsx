'use client';

import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import { type AnalysisSchema, AnalysisSortField } from '@tomato/constants';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { ANALYSIS_SCHEMA_LABEL } from '@/shared/lib/analysis-schema.constants';
import { buildHref } from '@/shared/lib/pagination';
import { SortTable } from '@/shared/lib/sort.constants';
import { useBranchAnalyses } from '../hooks/use-analyses';
import { GateStatusBadge, ResultStatusBadge } from './analysis-status-badges';

interface AnalysisListViewProps {
  branchId: string;
  schema: AnalysisSchema;
  params: { page: number; ordering?: string };
}

const linkClass = 'text-sm underline-offset-4 hover:underline focus-ring rounded-sm';

export function AnalysisListView({ branchId, schema, params: { page, ordering } }: AnalysisListViewProps) {
  const { data, error, isPending } = useBranchAnalyses(branchId, schema, page, ordering);
  const pathname = `/branches/${branchId}/${schema.toLowerCase()}`;
  const sortHref = (next: string | undefined) => buildHref(pathname, { ordering: next });

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
                  <SortableTableHead field={AnalysisSortField.TITLE} cacheKey={SortTable.ANALYSES} ordering={ordering} href={sortHref}>
                    Title
                  </SortableTableHead>
                  <SortableTableHead field={AnalysisSortField.CREATED_AT} cacheKey={SortTable.ANALYSES} ordering={ordering} href={sortHref}>
                    Date
                  </SortableTableHead>
                  <TableHead>Schema</TableHead>
                  <SortableTableHead field={AnalysisSortField.STATUS} cacheKey={SortTable.ANALYSES} ordering={ordering} href={sortHref}>
                    Result
                  </SortableTableHead>
                  <SortableTableHead field={AnalysisSortField.ISSUE_COUNT} cacheKey={SortTable.ANALYSES} ordering={ordering} href={sortHref} className="text-right">
                    Issues
                  </SortableTableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="max-w-64 truncate font-medium" title={analysis.title}>
                      {analysis.title}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(analysis.createdAt)}</TableCell>
                    <TableCell>
                      <Badge>{ANALYSIS_SCHEMA_LABEL[analysis.schema]}</Badge>
                    </TableCell>
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
          <PaginationBar page={page} total={data.total} buildHref={(target) => buildHref(pathname, { page: target > 1 ? target : undefined, ordering })} />
        </>
      ) : null}
    </section>
  );
}
