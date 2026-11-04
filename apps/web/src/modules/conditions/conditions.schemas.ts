import { AGGREGATE_LIMIT_TYPES, ConditionSortField, MetricConditionOperator } from '@tomato/constants';
import { z } from 'zod';
import { schemaParamsSchema } from '@/shared/lib/schema-params';
import { orderingParam } from '@/shared/lib/sort';

const operatorSchema = z.enum(Object.values(MetricConditionOperator) as [MetricConditionOperator, ...MetricConditionOperator[]], 'invalid');
const thresholdSchema = z.string().trim().min(1, 'invalid').transform(Number).pipe(z.number('invalid').min(0, 'invalid'));

export const aggregateLimitSchema = z.object({
  aggregate: z.enum(AGGREGATE_LIMIT_TYPES, 'invalid'),
  operator: operatorSchema,
  threshold: thresholdSchema,
});

const aggregatesSchema = z
  .array(aggregateLimitSchema)
  .refine((limits) => new Set(limits.map(({ aggregate }) => aggregate)).size === limits.length, 'invalid');

export const updateConditionSchema = z.object({
  operator: operatorSchema,
  isActive: z.boolean(),
  threshold: thresholdSchema,
  aggregates: aggregatesSchema.default([]),
});

export const createConditionSchema = z.object({
  metricId: z.string().min(1, 'required'),
  operator: operatorSchema,
  threshold: thresholdSchema,
  aggregates: aggregatesSchema.default([]),
});

export type CreateConditionInput = z.infer<typeof createConditionSchema>;

export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;

export const conditionListParamsSchema = schemaParamsSchema.extend({ ordering: orderingParam(ConditionSortField) });

export type ConditionListParams = z.infer<typeof conditionListParamsSchema>;
