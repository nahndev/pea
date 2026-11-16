'use client';

import { RepoSortField, Permission } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { PaginationBar } from '@/shared/components/pagination-bar';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { DEFAULT_ANALYSIS_SCHEMA } from '@/shared/lib/analysis-schema.constants';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { SortTable } from '@/shared/lib/sort.constants';
import { repoSchemaHref } from '../repo-schema-href';
import type { RepoListParams } from '../repos.schemas';
import { useRepos } from '../hooks/use-repos';
import { RepoSearchForm } from './repo-search-form';

interface RepoListViewProps {
  params: RepoListParams;
}

export function RepoListView({ params }: RepoListViewProps) {
  const { page, q: search, ordering } = params;
  const { data, error, isPending } = useRepos(params);
  const sortHref = (next: string | undefined) => buildHref('/repos', { q: search, ordering: next });

  return (
    <section className="flex flex-col gap-4">
      <RepoSearchForm key={search} search={search} ordering={ordering} />
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data && data.items.length === 0 ? (
        <EmptyState title={search ? 'No repo matches your search' : 'No repo yet'}>
          {search ? (
            'Try a different name.'
          ) : (
            <RequirePermission permission={Permission.REPO_ANALYSIS}>
              <Link href="/repos/new" className="underline">
                Create your first repo
              </Link>
            </RequirePermission>
          )}
        </EmptyState>
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field={RepoSortField.NAME} cacheKey={SortTable.REPOS} ordering={ordering} href={sortHref}>
                    Repo
                  </SortableTableHead>
                  <SortableTableHead field={RepoSortField.ANALYSIS_COUNT} cacheKey={SortTable.REPOS} ordering={ordering} href={sortHref} className="text-right">
                    Analyses
                  </SortableTableHead>
                  <SortableTableHead field={RepoSortField.LATEST_ANALYSIS_AT} cacheKey={SortTable.REPOS} ordering={ordering} href={sortHref}>
                    Last analysis
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={repoSchemaHref(repo.slug, DEFAULT_ANALYSIS_SCHEMA)}
                        className="break-all hover:underline focus-ring rounded-sm"
                      >
                        {repo.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{repo.analysisCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {repo.latestAnalysisAt ? formatDateTime(repo.latestAnalysisAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={page}
            total={data.total}
            buildHref={(target) => buildHref('/repos', { page: target > 1 ? target : undefined, q: search, ordering })}
          />
        </>
      ) : null}
    </section>
  );
}
