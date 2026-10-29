import type { MetricType } from '@tomato/constants';
import type { SubjectView } from '@tomato/types';
import { METRIC_LABEL } from './metrics.constants';

/** Same format as `MetricTrendSeries.key` returned by the API. */
export const metricSeriesKey = (metricId: string, subject: SubjectView | null) => `${metricId}:${subject?.uuid ?? ''}`;

export const metricSeriesLabel = (type: MetricType, subject: SubjectView | null) =>
  subject ? `${METRIC_LABEL[type]} · ${subject.description}` : METRIC_LABEL[type];
