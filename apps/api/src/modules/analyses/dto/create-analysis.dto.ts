import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  branch: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mergeRequestIid?: number;
}
