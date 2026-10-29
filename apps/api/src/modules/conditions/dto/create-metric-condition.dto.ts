import { MetricConditionOperator } from '@tomato/constants';
import { IsIn, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateMetricConditionDto {
  @IsUUID()
  metricId: string;

  @IsIn(Object.values(MetricConditionOperator))
  operator: MetricConditionOperator;

  @IsNumber()
  @Min(0)
  threshold: number;
}
