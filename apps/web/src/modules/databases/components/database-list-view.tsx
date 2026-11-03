'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { useDatabases } from '../hooks/use-databases';

export function DatabaseListView() {
  const { data, error, isPending } = useDatabases();

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
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Analyses</TableHead>
                <TableHead>Updated</TableHead>
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
