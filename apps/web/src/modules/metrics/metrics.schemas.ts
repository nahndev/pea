import { MetricHistorySortField, MetricResultSortField, MetricSortField, MetricType } from '@tomato/constants';
import { z } from 'zod';
import { schemaParamsSchema } from '@/shared/lib/schema-params';
import { orderingParam } from '@/shared/lib/sort';

export const updateMetricSchema = z.object({
  description: z.string().trim().min(1, 'required').max(255, 'too_long'),
  isActive: z.boolean(),
  include: z.array(z.string()),
  exclude: z.array(z.string()),
});

export type UpdateMetricInput = z.infer<typeof updateMetricSchema>;

const page = z.coerce.number().int().min(1).catch(1);

export const metricListParamsSchema = schemaParamsSchema.extend({ ordering: orderingParam(MetricSortField) });

export type MetricListParams = z.infer<typeof metricListParamsSchema>;

export const metricPageParamsSchema = z.object({
  page,
  ordering: orderingParam(MetricHistorySortField),
});

export type MetricPageParams = z.infer<typeof metricPageParamsSchema>;

export const metricResultListParamsSchema = z.object({
  page,
  metricType: z.enum(Object.values(MetricType) as [MetricType, ...MetricType[]]).optional().catch(undefined),
  subjectUuid: z.uuid().optional().catch(undefined),
  ordering: orderingParam(MetricResultSortField),
});

export type MetricResultListParams = z.infer<typeof metricResultListParamsSchema>;
