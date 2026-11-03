import { AGGREGATE_LIMIT_TYPES, MetricConditionOperator } from '@tomato/constants';
import type { MetricConditionAggregateLimit } from '@tomato/types';
import type { Prisma } from '../../generated/client';

const isLimit = (item: Prisma.JsonValue): item is Prisma.JsonObject & MetricConditionAggregateLimit =>
  typeof item === 'object' &&
  item !== null &&
  !Array.isArray(item) &&
  AGGREGATE_LIMIT_TYPES.some((aggregate) => aggregate === item.aggregate) &&
  Object.values(MetricConditionOperator).some((operator) => operator === item.operator) &&
  typeof item.threshold === 'number';

export const parseAggregateLimits = (value: Prisma.JsonValue): MetricConditionAggregateLimit[] =>
  Array.isArray(value)
    ? value.filter(isLimit).map(({ aggregate, operator, threshold }) => ({ aggregate, operator, threshold }))
    : [];
