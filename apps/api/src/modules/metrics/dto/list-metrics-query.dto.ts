import { AnalysisSchema } from '@tomato/constants';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class ListMetricsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema?: AnalysisSchema;
}
