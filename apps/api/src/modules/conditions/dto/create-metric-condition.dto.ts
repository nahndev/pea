import { AGGREGATE_LIMIT_TYPES, MetricConditionOperator } from '@tomato/constants';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { AggregateLimitDto } from './aggregate-limit.dto';

export class CreateMetricConditionDto {
  @IsUUID()
  metricId: string;

  @IsIn(Object.values(MetricConditionOperator))
  operator: MetricConditionOperator;

  @IsNumber()
  @Min(0)
  threshold: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(AGGREGATE_LIMIT_TYPES.length)
  @ArrayUnique(({ aggregate }: AggregateLimitDto) => aggregate)
  @ValidateNested({ each: true })
  @Type(() => AggregateLimitDto)
  aggregates?: AggregateLimitDto[];
}
