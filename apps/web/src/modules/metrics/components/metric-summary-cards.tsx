import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tomato/ui';
import { GateStatusBadge } from '@/modules/analyses';
import { formatDuration } from '@/shared/lib/format';
import { METRIC_LABEL, VIOLATION_PHRASE } from '../metrics.constants';
import type { MetricSummary } from '../summarize-metrics';

interface MetricSummaryCardsProps {
  summaries: MetricSummary[];
}

export function MetricSummaryCards({ summaries }: MetricSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summaries.map(({ type, worstValue, gateStatus, limit }) => (
        <Card key={type}>
          <CardHeader>
            <CardDescription>{METRIC_LABEL[type]}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatDuration(worstValue)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Quality gate</span>
              <GateStatusBadge status={gateStatus} />
            </div>
            <p className="text-muted-foreground">
              {limit ? `Fails when ${VIOLATION_PHRASE[limit.operator]} ${formatDuration(limit.threshold)}.` : 'No gate condition applies.'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
