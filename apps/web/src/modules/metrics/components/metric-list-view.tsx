'use client';

import { MetricSortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { buildHref } from '@/shared/lib/pagination';
import { useMetrics } from '../hooks/use-metrics';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '../metrics.constants';
import type { MetricListParams } from '../metrics.schemas';

interface MetricListViewProps {
  params: MetricListParams;
}

export function MetricListView({ params }: MetricListViewProps) {
  const router = useRouter();
  const { data, error, isPending } = useMetrics(params);
  const { ordering } = params;
  const sortHref = (next: string | undefined) => buildHref('/metrics', { schema: params.schema, ordering: next });

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data?.length === 0 ? <EmptyState title="No metric yet" /> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <SortableTableHead field={MetricSortField.TYPE} ordering={ordering} href={sortHref} className="w-1/4">
                  Metric
                </SortableTableHead>
                <SortableTableHead field={MetricSortField.DESCRIPTION} ordering={ordering} href={sortHref}>
                  Description
                </SortableTableHead>
                <SortableTableHead field={MetricSortField.UNIT} ordering={ordering} href={sortHref} className="w-20">
                  Unit
                </SortableTableHead>
                <SortableTableHead field={MetricSortField.STATUS} ordering={ordering} href={sortHref} className="w-28">
                  Status
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, type, unit, description, isActive }) => (
                <TableRow
                  key={id}
                  className="cursor-pointer"
                  onClick={(event) => {
                    if (!(event.target as HTMLElement).closest('a')) router.push(`/metrics/${id}`);
                  }}
                >
                  <TableCell className="font-medium">
                    <Link href={`/metrics/${id}`} title={METRIC_LABEL[type]} className="block truncate hover:underline focus-ring rounded-sm">
                      {METRIC_LABEL[type]}
                    </Link>
                  </TableCell>
                  <TableCell className="truncate text-muted-foreground" title={description}>
                    {description}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{METRIC_UNIT_LABEL[unit]}</TableCell>
                  <TableCell>
                    <StatusBadge style={isActive ? { label: 'Active', intent: 'success' } : { label: 'Disabled', intent: 'neutral' }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
