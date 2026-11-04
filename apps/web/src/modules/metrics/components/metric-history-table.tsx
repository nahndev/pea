import { MetricHistorySortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import type { MetricHistoryItemView, MetricView } from '@tomato/types';
import Link from 'next/link';
import { GateStatusBadge } from '@/modules/analyses';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { formatDateTime } from '@/shared/lib/format';
import { formatMetricValue } from '../format-metric-value';
import { VIOLATION_PHRASE } from '../metrics.constants';

interface MetricHistoryTableProps {
  metric: MetricView;
  items: MetricHistoryItemView[];
  ordering: string | undefined;
  sortHref: (ordering: string | undefined) => string;
}

export function MetricHistoryTable({ metric, items, ordering, sortHref }: MetricHistoryTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow-card">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <SortableTableHead field={MetricHistorySortField.ANALYSIS} ordering={ordering} href={sortHref} className="w-[28%]">
              Analysis
            </SortableTableHead>
            <SortableTableHead field={MetricHistorySortField.BRANCH} ordering={ordering} href={sortHref} className="w-[14%]">
              Branch
            </SortableTableHead>
            <SortableTableHead field={MetricHistorySortField.SUBJECT} ordering={ordering} href={sortHref}>
              Subject
            </SortableTableHead>
            <SortableTableHead field={MetricHistorySortField.VALUE} ordering={ordering} href={sortHref} className="w-28 text-right">
              Value
            </SortableTableHead>
            <TableHead className="w-44">Conditions</TableHead>
            <SortableTableHead field={MetricHistorySortField.CREATED_AT} ordering={ordering} href={sortHref} className="w-44">
              Measured
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(({ id, value, createdAt, subject, analysis, evaluations }) => (
            <TableRow key={id}>
              <TableCell className="font-medium">
                <Link
                  href={`/analyses/${analysis.id}/metrics`}
                  title={analysis.title}
                  className="block truncate hover:underline focus-ring rounded-sm"
                >
                  {analysis.title}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/branches/${analysis.branch.id}`}
                  title={analysis.branch.name}
                  className="block truncate text-muted-foreground hover:underline focus-ring rounded-sm"
                >
                  {analysis.branch.name}
                </Link>
              </TableCell>
              <TableCell className="truncate font-mono text-xs" title={subject?.description}>
                {subject?.description ?? <span className="font-sans text-muted-foreground">All</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatMetricValue(metric.unit, value)}</TableCell>
              <TableCell>
                {evaluations.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {evaluations.map((evaluation) => (
                      <li
                        key={`${evaluation.aggregate}-${evaluation.operator}-${evaluation.threshold}`}
                        title={`Fails ${VIOLATION_PHRASE[evaluation.operator]} ${formatMetricValue(metric.unit, evaluation.threshold)}`}
                      >
                        <GateStatusBadge status={evaluation.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
