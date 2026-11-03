import { AGGREGATE_LIMIT_TYPES, type AggregateLimitType, MetricConditionOperator } from '@tomato/constants';
import { IsIn, IsNumber, Min } from 'class-validator';

export class AggregateLimitDto {
  @IsIn(AGGREGATE_LIMIT_TYPES)
  aggregate: AggregateLimitType;

  @IsIn(Object.values(MetricConditionOperator))
  operator: MetricConditionOperator;

  @IsNumber()
  @Min(0)
  threshold: number;
}
