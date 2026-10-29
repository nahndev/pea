import { MetricConditionOperator } from '@tomato/constants';
import { z } from 'zod';

export const updateConditionSchema = z.object({
  operator: z.enum(Object.values(MetricConditionOperator) as [MetricConditionOperator, ...MetricConditionOperator[]], 'invalid'),
  isActive: z.boolean(),
  threshold: z.string().trim().min(1, 'invalid').transform(Number).pipe(z.number('invalid').min(0, 'invalid')),
});

export const createConditionSchema = z.object({
  qualityGateId: z.string().min(1, 'required'),
  metricId: z.string().min(1, 'required'),
  operator: updateConditionSchema.shape.operator,
  threshold: updateConditionSchema.shape.threshold,
});

export type CreateConditionInput = z.infer<typeof createConditionSchema>;

export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;
