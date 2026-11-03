import { AGGREGATE_LIMIT_TYPES, MetricConditionOperator } from '@tomato/constants';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { AggregateLimitDto } from './aggregate-limit.dto';

export class UpdateMetricConditionDto {
  @IsOptional()
  @IsIn(Object.values(MetricConditionOperator))
  operator?: MetricConditionOperator;

  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(AGGREGATE_LIMIT_TYPES.length)
  @ArrayUnique(({ aggregate }: AggregateLimitDto) => aggregate)
  @ValidateNested({ each: true })
  @Type(() => AggregateLimitDto)
  aggregates?: AggregateLimitDto[];
}
