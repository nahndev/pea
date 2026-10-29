import { AnalysisSchema } from '@tomato/constants';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  branch: string;

  @IsIn(Object.values(AnalysisSchema))
  schema: AnalysisSchema;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mergeRequestIid?: number;
}
