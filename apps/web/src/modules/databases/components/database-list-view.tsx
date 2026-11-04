'use client';

import { DatabaseSortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import type { DatabaseListParams } from '../databases.schemas';
import { useDatabases } from '../hooks/use-databases';

interface DatabaseListViewProps {
  params: DatabaseListParams;
}

export function DatabaseListView({ params }: DatabaseListViewProps) {
  const { data, error, isPending } = useDatabases(params);
  const sortHref = (next: string | undefined) => buildHref('/databases', { ordering: next });

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data?.length === 0 ? <EmptyState title="No database yet">Add a database to run database analyses.</EmptyState> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field={DatabaseSortField.NAME} ordering={params.ordering} href={sortHref}>
                  Name
                </SortableTableHead>
                <SortableTableHead field={DatabaseSortField.ADDRESS} ordering={params.ordering} href={sortHref}>
                  Address
                </SortableTableHead>
                <SortableTableHead field={DatabaseSortField.ANALYSIS_COUNT} ordering={params.ordering} href={sortHref} className="text-right">
                  Analyses
                </SortableTableHead>
                <SortableTableHead field={DatabaseSortField.UPDATED_AT} ordering={params.ordering} href={sortHref}>
                  Updated
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, name, address, analysisCount, updatedAt }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <Link href={`/databases/${id}`} className="hover:underline focus-ring rounded-sm">
                      {name}
                    </Link>
                  </TableCell>
                  <TableCell className="break-all font-mono text-xs text-muted-foreground">{address}</TableCell>
                  <TableCell className="text-right tabular-nums">{analysisCount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
