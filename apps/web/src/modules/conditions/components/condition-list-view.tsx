'use client';

import type { AnalysisSchema } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { StatusBadge } from '@/shared/components/status-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { METRIC_LABEL, VIOLATION_PHRASE, formatMetricValue } from '@/modules/metrics';
import { useConditions } from '../hooks/use-conditions';

interface ConditionListViewProps {
  schema: AnalysisSchema;
}

export function ConditionListView({ schema }: ConditionListViewProps) {
  const { data, error, isPending } = useConditions(schema);

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data?.length === 0 ? <EmptyState title="No condition yet" /> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Fails when</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, metric, operator, threshold, isActive }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <Link href={`/conditions/${id}`} className="hover:underline focus-ring rounded-sm">
                      {METRIC_LABEL[metric.type]}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {VIOLATION_PHRASE[operator]} {formatMetricValue(metric.unit, threshold)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      style={
                        !metric.isActive
                          ? { label: 'Metric disabled', intent: 'warning' }
                          : isActive
                            ? { label: 'Active', intent: 'success' }
                            : { label: 'Disabled', intent: 'neutral' }
                      }
                    />
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
