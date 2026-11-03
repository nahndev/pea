import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RuleConfigDto {
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

  @IsOptional()
  @IsInt()
  @Min(1)
  minCalls?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minRows?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercent?: number;
}
