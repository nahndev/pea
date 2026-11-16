'use client';

import { type AnalysisSchema, SUBJECT_METRIC_TYPES } from '@tomato/constants';
import { Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { METRIC_LABEL, METRIC_UNIT_LABEL } from '@/modules/metrics';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { useChartMetrics, useUpdateChartMetric } from '../hooks/use-charts';

interface ChartSettingsViewProps {
  schema: AnalysisSchema;
}

export function ChartSettingsView({ schema }: ChartSettingsViewProps) {
  const { data, error, isPending } = useChartMetrics(schema);
  const update = useUpdateChartMetric();
  const pendingId = update.isPending ? update.variables?.id : undefined;

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {update.error ? <ErrorState error={update.error} title="Unable to save" /> : null}
      {data?.length === 0 ? <EmptyState title="No metric yet" /> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="w-20">Unit</TableHead>
                <TableHead className="w-24">Card</TableHead>
                <TableHead className="w-24">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, type, unit, isActive, isCard, isTrend }) => {
                const label = METRIC_LABEL[type];
                const isSaving = pendingId === id;
                const isPerSubject = SUBJECT_METRIC_TYPES.includes(type);
                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">
                      <Link href={`/metrics/${id}`} title={label} className="block truncate hover:underline focus-ring rounded-sm">
                        {label}
                        {isActive ? null : <span className="ml-2 text-xs font-normal text-muted-foreground">(disabled)</span>}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{METRIC_UNIT_LABEL[unit]}</TableCell>
                    <TableCell>
                      <Switch
                        checked={isCard}
                        disabled={isSaving}
                        aria-label={`Show ${label} as a card`}
                        onCheckedChange={(checked) => update.mutate({ id, input: { isCard: checked } })}
                      />
                    </TableCell>
                    <TableCell title={isPerSubject ? 'Measured per subject: no overall line to draw' : undefined}>
                      <Switch
                        checked={isTrend}
                        disabled={isSaving || isPerSubject}
                        aria-label={`Show ${label} as a trend line`}
                        onCheckedChange={(checked) => update.mutate({ id, input: { isTrend: checked } })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
