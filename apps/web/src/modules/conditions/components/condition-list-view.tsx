'use client';

import { ConditionSortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { StatusBadge } from '@/shared/components/status-badge';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { buildHref } from '@/shared/lib/pagination';
import { AGGREGATE_LABEL, METRIC_LABEL, VIOLATION_PHRASE, formatMetricValue } from '@/modules/metrics';
import type { ConditionListParams } from '../conditions.schemas';
import { useConditions } from '../hooks/use-conditions';

interface ConditionListViewProps {
  params: ConditionListParams;
}

export function ConditionListView({ params }: ConditionListViewProps) {
  const { data, error, isPending } = useConditions(params);
  const { ordering } = params;
  const sortHref = (next: string | undefined) => buildHref('/conditions', { schema: params.schema, ordering: next });

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
                <SortableTableHead field={ConditionSortField.METRIC} ordering={ordering} href={sortHref}>
                  Metric
                </SortableTableHead>
                <SortableTableHead field={ConditionSortField.THRESHOLD} ordering={ordering} href={sortHref}>
                  Fails when
                </SortableTableHead>
                <SortableTableHead field={ConditionSortField.STATUS} ordering={ordering} href={sortHref}>
                  Status
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, metric, operator, threshold, aggregates, isActive }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <Link href={`/conditions/${id}`} className="hover:underline focus-ring rounded-sm">
                      {METRIC_LABEL[metric.type]}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>
                      {VIOLATION_PHRASE[operator]} {formatMetricValue(metric.unit, threshold)}
                    </div>
                    {aggregates.map((limit) => (
                      <div key={limit.aggregate} className="text-xs">
                        {VIOLATION_PHRASE[limit.operator]} {formatMetricValue(metric.unit, limit.threshold)} over{' '}
                        {AGGREGATE_LABEL[limit.aggregate].toLowerCase()} of passed runs
                      </div>
                    ))}
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
