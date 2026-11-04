import { MetricResultSortField, type MetricUnit } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import type { MetricResultView } from '@tomato/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GateStatusBadge } from '@/modules/analyses';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { SortTable } from '@/shared/lib/sort.constants';
import { formatMetricValue } from '../format-metric-value';
import { metricSeriesKey, metricSeriesLabel } from '../metric-series';
import { AGGREGATE_LABEL, METRIC_LABEL, METRIC_UNIT_LABEL, VIOLATION_PHRASE } from '../metrics.constants';

interface MetricResultsTableProps {
  results: MetricResultView[];
  pickedKeys: string[];
  pickedUnit: MetricUnit | undefined;
  onToggle: (result: MetricResultView) => void;
  ordering: string | undefined;
  sortHref: (ordering: string | undefined) => string;
}

export function MetricResultsTable({ results, pickedKeys, pickedUnit, onToggle, ordering, sortHref }: MetricResultsTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Show in trend chart</span>
            </TableHead>
            <SortableTableHead field={MetricResultSortField.METRIC} cacheKey={SortTable.METRIC_RESULTS} ordering={ordering} href={sortHref} scroll={false} className="w-1/5">
              Metric
            </SortableTableHead>
            <SortableTableHead field={MetricResultSortField.SUBJECT} cacheKey={SortTable.METRIC_RESULTS} ordering={ordering} href={sortHref} scroll={false} className="w-1/4">
              Endpoint
            </SortableTableHead>
            <SortableTableHead field={MetricResultSortField.VALUE} cacheKey={SortTable.METRIC_RESULTS} ordering={ordering} href={sortHref} scroll={false} className="w-28 text-right">
              Value
            </SortableTableHead>
            <SortableTableHead field={MetricResultSortField.UNIT} cacheKey={SortTable.METRIC_RESULTS} ordering={ordering} href={sortHref} scroll={false} className="w-20">
              Unit
            </SortableTableHead>
            <TableHead>Conditions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const { id, metric, subject, value, evaluations } = result;
            const key = metricSeriesKey(metric.id, subject);
            const isPicked = pickedKeys.includes(key);
            const isOtherUnit = pickedUnit !== undefined && pickedUnit !== metric.unit;
            return (
              <TableRow
                key={id}
                className="cursor-pointer"
                onClick={(event) => {
                  if (!(event.target as HTMLElement).closest('a, input')) router.push(`/metrics/${metric.id}`);
                }}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isPicked}
                    disabled={!isPicked && isOtherUnit}
                    onChange={() => onToggle(result)}
                    aria-label={`Show ${metricSeriesLabel(metric.type, subject)} in the trend chart`}
                    title={!isPicked && isOtherUnit ? 'Metrics with a different unit cannot share a chart' : undefined}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/metrics/${metric.id}`} title={METRIC_LABEL[metric.type]} className="block truncate hover:underline focus-ring rounded-sm">
                    {METRIC_LABEL[metric.type]}
                  </Link>
                </TableCell>
                <TableCell className="truncate font-mono text-xs" title={subject?.description}>
                  {subject?.description ?? <span className="font-sans text-muted-foreground">All requests</span>}
                </TableCell>
                <TableCell className="truncate text-right tabular-nums">{formatMetricValue(metric.unit, value)}</TableCell>
                <TableCell className="truncate text-muted-foreground">{METRIC_UNIT_LABEL[metric.unit]}</TableCell>
                <TableCell>
                  {evaluations.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {evaluations.map((evaluation) => {
                        const phrase = `Fails ${VIOLATION_PHRASE[evaluation.operator]} ${formatMetricValue(metric.unit, evaluation.threshold)}${
                          evaluation.baseline !== null
                            ? ` over ${AGGREGATE_LABEL[evaluation.aggregate].toLowerCase()} of passed runs (${formatMetricValue(metric.unit, evaluation.baseline)})`
                            : ''
                        }`;
                        return (
                          <li key={`${evaluation.aggregate}-${evaluation.operator}-${evaluation.threshold}`} className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0">
                              <GateStatusBadge status={evaluation.status} />
                            </span>
                            <span className="truncate text-xs text-muted-foreground" title={phrase}>
                              {phrase}
                            </span>
                          </li>
                        );
                      })}
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
