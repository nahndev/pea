import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import type { MetricResultView } from '@tomato/types';
import { GateStatusBadge } from '@/modules/analyses';
import { formatMetricValue } from '../format-metric-value';
import { metricSeriesKey, metricSeriesLabel } from '../metric-series';
import { METRIC_LABEL, METRIC_UNIT_LABEL, VIOLATION_PHRASE } from '../metrics.constants';

interface MetricResultsTableProps {
  results: MetricResultView[];
  picked: string[];
  onToggle: (key: string) => void;
}

export function MetricResultsTable({ results, picked, onToggle }: MetricResultsTableProps) {
  const pickedUnit = results.find(({ metric, subject }) => picked.includes(metricSeriesKey(metric.id, subject)))?.metric.unit;

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Show in trend chart</span>
            </TableHead>
            <TableHead>Metric</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Quality gate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map(({ id, metric, subject, value, evaluations }) => {
            const key = metricSeriesKey(metric.id, subject);
            const isPicked = picked.includes(key);
            const isOtherUnit = pickedUnit !== undefined && pickedUnit !== metric.unit;
            return (
              <TableRow key={id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isPicked}
                    disabled={!isPicked && isOtherUnit}
                    onChange={() => onToggle(key)}
                    aria-label={`Show ${metricSeriesLabel(metric.type, subject)} in the trend chart`}
                    title={!isPicked && isOtherUnit ? 'Metrics with a different unit cannot share a chart' : undefined}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">{METRIC_LABEL[metric.type]}</TableCell>
                <TableCell className="max-w-56 break-all font-mono text-xs">
                  {subject || <span className="font-sans text-muted-foreground">All requests</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatMetricValue(metric.unit, value)}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{METRIC_UNIT_LABEL[metric.unit]}</TableCell>
                <TableCell>
                  {evaluations.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {evaluations.map((evaluation) => (
                        <li key={`${evaluation.qualityGate}-${evaluation.operator}-${evaluation.threshold}`} className="flex items-center gap-2 whitespace-nowrap">
                          <GateStatusBadge status={evaluation.status} />
                          <span className="text-xs text-muted-foreground">
                            {evaluation.qualityGate}: fails {VIOLATION_PHRASE[evaluation.operator]} {formatMetricValue(metric.unit, evaluation.threshold)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
