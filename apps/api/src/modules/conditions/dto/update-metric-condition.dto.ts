import { MetricConditionOperator } from '@tomato/constants';
import { IsBoolean, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

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
}
