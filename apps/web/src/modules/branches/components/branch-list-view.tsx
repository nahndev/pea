'use client';

import { BranchSortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { DEFAULT_ANALYSIS_SCHEMA } from '@/shared/lib/analysis-schema.constants';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { branchSchemaHref } from '../branch-schema-href';
import type { BranchListParams } from '../branches.schemas';
import { useBranches } from '../hooks/use-branches';
import { BranchSearchForm } from './branch-search-form';

interface BranchListViewProps {
  params: BranchListParams;
}

export function BranchListView({ params }: BranchListViewProps) {
  const { page, q: search, ordering } = params;
  const { data, error, isPending } = useBranches(params);
  const sortHref = (next: string | undefined) => buildHref('/branches', { q: search, ordering: next });

  return (
    <section className="flex flex-col gap-4">
      <BranchSearchForm key={search} search={search} ordering={ordering} />
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data && data.items.length === 0 ? (
        <EmptyState title={search ? 'No branch matches your search' : 'No branch yet'}>
          {search ? (
            'Try a different name.'
          ) : (
            <Link href="/branches/new" className="underline">
              Create your first branch
            </Link>
          )}
        </EmptyState>
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field={BranchSortField.NAME} ordering={ordering} href={sortHref}>
                    Branch
                  </SortableTableHead>
                  <SortableTableHead field={BranchSortField.ANALYSIS_COUNT} ordering={ordering} href={sortHref} className="text-right">
                    Analyses
                  </SortableTableHead>
                  <SortableTableHead field={BranchSortField.LATEST_ANALYSIS_AT} ordering={ordering} href={sortHref}>
                    Last analysis
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={branchSchemaHref(branch.id, DEFAULT_ANALYSIS_SCHEMA)}
                        className="break-all hover:underline focus-ring rounded-sm"
                      >
                        {branch.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{branch.analysisCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.latestAnalysisAt ? formatDateTime(branch.latestAnalysisAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={page}
            total={data.total}
            buildHref={(target) => buildHref('/branches', { page: target > 1 ? target : undefined, q: search, ordering })}
          />
        </>
      ) : null}
    </section>
  );
}
