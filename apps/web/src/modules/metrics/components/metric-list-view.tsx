'use client';

import type { AnalysisSchema } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { useMetrics } from '../hooks/use-metrics';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '../metrics.constants';

interface MetricListViewProps {
  schema: AnalysisSchema;
}

export function MetricListView({ schema }: MetricListViewProps) {
  const router = useRouter();
  const { data, error, isPending } = useMetrics(schema);

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
                <TableHead className="w-1/4">Metric</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20">Unit</TableHead>
                <TableHead className="w-28">Status</TableHead>
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
