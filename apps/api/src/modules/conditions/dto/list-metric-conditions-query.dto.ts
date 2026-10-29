import { AnalysisSchema } from '@tomato/constants';
import { IsIn, IsOptional } from 'class-validator';

export class ListMetricConditionsQueryDto {
  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema?: AnalysisSchema;
}
