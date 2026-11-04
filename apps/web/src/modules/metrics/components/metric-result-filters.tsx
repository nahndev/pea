'use client';

import type { MetricType } from '@tomato/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { buildHref } from '@/shared/lib/pagination';
import { useMetricResultFilters } from '../hooks/use-metrics';
import { ALL_FILTER, METRIC_LABEL, METRIC_RESULTS_ANCHOR } from '../metrics.constants';
import type { MetricResultListParams } from '../metrics.schemas';

interface MetricResultFiltersProps {
  analysisId: string;
  params: MetricResultListParams;
}

export function MetricResultFilters({ analysisId, params }: MetricResultFiltersProps) {
  const router = useRouter();
  const { data } = useMetricResultFilters(analysisId);

  const update = (change: Partial<Pick<MetricResultListParams, 'metricType' | 'subjectUuid'>>) => {
    const next = { ...params, ...change };
    const href = buildHref(`/analyses/${analysisId}/metrics`, {
      metricType: next.metricType,
      subjectUuid: next.subjectUuid,
      ordering: next.ordering,
    });
    router.push(`${href}#${METRIC_RESULTS_ANCHOR}`, { scroll: false });
  };
  const toFilter = (value: string) => (value === ALL_FILTER ? undefined : value);

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={params.metricType ?? ALL_FILTER} onValueChange={(value) => update({ metricType: toFilter(value) as MetricType | undefined })}>
        <SelectTrigger aria-label="Filter by metric" className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>All metrics</SelectItem>
          {data?.metricTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {METRIC_LABEL[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.subjectUuid ?? ALL_FILTER} onValueChange={(value) => update({ subjectUuid: toFilter(value) })}>
        <SelectTrigger aria-label="Filter by endpoint" className="w-72 max-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-w-md">
          <SelectItem value={ALL_FILTER}>All endpoints</SelectItem>
          {data?.subjects.map(({ uuid, description }) => (
            <SelectItem key={uuid} value={uuid} title={description} className="font-mono text-xs">
              <span className="truncate">{description}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
