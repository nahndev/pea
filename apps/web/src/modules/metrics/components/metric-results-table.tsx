import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import type { MetricResultView } from '@tomato/types';
import { GateStatusBadge } from '@/modules/analyses';
import { formatDuration } from '@/shared/lib/format';
import { METRIC_LABEL, VIOLATION_PHRASE } from '../metrics.constants';

interface MetricResultsTableProps {
  results: MetricResultView[];
}

export function MetricResultsTable({ results }: MetricResultsTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>File</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Quality gate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map(({ id, metric, context, value, evaluations }) => (
            <TableRow key={id}>
              <TableCell className="whitespace-nowrap font-medium">{METRIC_LABEL[metric.type]}</TableCell>
              <TableCell className="max-w-56 break-all font-mono text-xs">{context.file}</TableCell>
              <TableCell className="text-right tabular-nums">{formatDuration(value)}</TableCell>
              <TableCell>
                {evaluations.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {evaluations.map((evaluation) => (
                      <li key={`${evaluation.qualityGate}-${evaluation.operator}-${evaluation.threshold}`} className="flex items-center gap-2 whitespace-nowrap">
                        <GateStatusBadge status={evaluation.status} />
                        <span className="text-xs text-muted-foreground">
                          {evaluation.qualityGate}: fails {VIOLATION_PHRASE[evaluation.operator]} {formatDuration(evaluation.threshold)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
