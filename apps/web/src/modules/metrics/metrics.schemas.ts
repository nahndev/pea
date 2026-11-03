import { z } from 'zod';

export const updateMetricSchema = z.object({
  description: z.string().trim().min(1, 'required').max(255, 'too_long'),
  isActive: z.boolean(),
  include: z.array(z.string()),
  exclude: z.array(z.string()),
});

export type UpdateMetricInput = z.infer<typeof updateMetricSchema>;

export const metricPageParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type MetricPageParams = z.infer<typeof metricPageParamsSchema>;
