import { Severity } from '@tomato/constants';
import { IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateRuleDto {
  @IsOptional()
  @IsIn(Object.values(Severity))
  severity?: Severity;

  @IsOptional()
  @IsInt()
  @Min(1)
  thresholdMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minRequests?: number;
}
