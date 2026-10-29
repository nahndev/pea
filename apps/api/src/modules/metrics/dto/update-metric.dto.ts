import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MAX_METRIC_SUBJECT_FILTERS } from '../metrics.constants';

export class UpdateMetricDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_METRIC_SUBJECT_FILTERS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  include?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_METRIC_SUBJECT_FILTERS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  exclude?: string[];
}
