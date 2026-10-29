import type { MetricType } from '@tomato/constants';
import { METRIC_LABEL } from './metrics.constants';

/** Same format as `MetricTrendSeries.key` returned by the API. */
export const metricSeriesKey = (metricId: string, subject: string) => `${metricId}:${subject}`;

export const metricSeriesLabel = (type: MetricType, subject: string) =>
  subject ? `${METRIC_LABEL[type]} · ${subject}` : METRIC_LABEL[type];
