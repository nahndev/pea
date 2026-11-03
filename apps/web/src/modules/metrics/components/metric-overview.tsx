import type { MetricView } from '@tomato/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@tomato/ui';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/shared/components/status-badge';
import { formatNumber } from '@/shared/lib/format';
import { METRIC_UNIT_LABEL } from '../metrics.constants';

interface MetricOverviewProps {
  metric: MetricView;
  total?: number;
}

const describeScope = ({ include, exclude }: MetricView) => {
  const scope = include.length ? `${include.length} included` : 'All subjects';
  return exclude.length ? `${scope} · ${exclude.length} excluded` : scope;
};

export function MetricOverview({ metric, total }: MetricOverviewProps) {
  const items: { label: string; value: ReactNode }[] = [
    {
      label: 'Status',
      value: <StatusBadge style={metric.isActive ? { label: 'Active', intent: 'success' } : { label: 'Disabled', intent: 'neutral' }} />,
    },
    { label: 'Unit', value: METRIC_UNIT_LABEL[metric.unit] },
    { label: 'Scope', value: describeScope(metric) },
    { label: 'Results', value: total === undefined ? '—' : formatNumber(total) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="truncate text-xl tabular-nums">{value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
