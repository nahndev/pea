import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import type { MetricHistoryItemView, MetricView } from '@tomato/types';
import Link from 'next/link';
import { GateStatusBadge } from '@/modules/analyses';
import { formatDateTime } from '@/shared/lib/format';
import { formatMetricValue } from '../format-metric-value';
import { VIOLATION_PHRASE } from '../metrics.constants';

interface MetricHistoryTableProps {
  metric: MetricView;
  items: MetricHistoryItemView[];
}

export function MetricHistoryTable({ metric, items }: MetricHistoryTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow-card">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[28%]">Analysis</TableHead>
            <TableHead className="w-[14%]">Branch</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-28 text-right">Value</TableHead>
            <TableHead className="w-44">Conditions</TableHead>
            <TableHead className="w-44">Measured</TableHead>
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
