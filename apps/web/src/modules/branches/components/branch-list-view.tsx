'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { ANALYSIS_SCHEMA_LABEL, DEFAULT_ANALYSIS_SCHEMA, analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
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
          {search ? 'Try a different name.' : (
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
                  <TableHead>Schemas</TableHead>
                  <TableHead className="text-right">Analyses</TableHead>
                  <TableHead>Last analysis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      <Link href={branchSchemaHref(branch.id, DEFAULT_ANALYSIS_SCHEMA)} className="break-all hover:underline focus-ring rounded-sm">
                        {branch.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <nav aria-label={`Schemas of ${branch.name}`} className="flex gap-3">
                        {analysisSchemaValues.map((schema) => (
                          <Link key={schema} href={branchSchemaHref(branch.id, schema)} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-ring rounded-sm">
                            {ANALYSIS_SCHEMA_LABEL[schema]}
                          </Link>
                        ))}
                      </nav>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{branch.analysisCount}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.latestAnalysisAt ? formatDateTime(branch.latestAnalysisAt) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar page={page} total={data.total} buildHref={(target) => buildHref('/branches', { page: target > 1 ? target : undefined, q: search })} />
        </>
      ) : null}
    </section>
  );
}
