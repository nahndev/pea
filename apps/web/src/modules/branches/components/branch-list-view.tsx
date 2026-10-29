'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { DEFAULT_ANALYSIS_SCHEMA } from '@/shared/lib/analysis-schema.constants';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { branchSchemaHref } from '../branch-schema-href';
import { useBranches } from '../hooks/use-branches';
import { BranchSearchForm } from './branch-search-form';

interface BranchListViewProps {
  page: number;
  search?: string;
}

export function BranchListView({ page, search }: BranchListViewProps) {
  const { data, error, isPending } = useBranches(page, search);

  return (
    <section className="flex flex-col gap-4">
      <BranchSearchForm key={search} search={search} />
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
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Analyses</TableHead>
                  <TableHead>Last analysis</TableHead>
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
            buildHref={(target) => buildHref('/branches', { page: target > 1 ? target : undefined, q: search })}
          />
        </>
      ) : null}
    </section>
  );
}
