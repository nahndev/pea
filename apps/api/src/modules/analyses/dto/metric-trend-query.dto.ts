import { AnalysisSchema } from '@tomato/constants';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { MAX_TREND_PICKS } from '../analyses.constants';

const PICK_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:.{0,255}$/i;

export class MetricTrendQueryDto {
  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema: AnalysisSchema = AnalysisSchema.API;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (Array.isArray(value) ? (value as unknown[]) : [value]))
  @IsArray()
  @ArrayMaxSize(MAX_TREND_PICKS)
  @Matches(PICK_PATTERN, { each: true })
  pick?: string[];
}
