'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { ANALYSIS_SCHEMA_LABEL } from '@/shared/lib/analysis-schema.constants';
import { useMetrics } from '../hooks/use-metrics';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '../metrics.constants';

export function MetricListView() {
  const { data, error, isPending } = useMetrics();

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data?.length === 0 ? <EmptyState title="No metric yet" /> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, schema, type, unit, description, isActive }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <Link href={`/metrics/${id}`} className="hover:underline focus-ring rounded-sm">
                      {METRIC_LABEL[type]}
                    </Link>
                  </TableCell>
                  <TableCell>{ANALYSIS_SCHEMA_LABEL[schema]}</TableCell>
                  <TableCell className="text-muted-foreground">{description}</TableCell>
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
