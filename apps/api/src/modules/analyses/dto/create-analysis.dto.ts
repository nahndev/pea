import { AnalysisSchema } from '@tomato/constants';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { POSTGRES_URL_PATTERN } from '../analyses.constants';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const isDatabase = ({ schema }: CreateAnalysisDto) => schema === AnalysisSchema.DATABASE;

export class CreateAnalysisDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  branch: string;

  @IsIn(Object.values(AnalysisSchema))
  schema: AnalysisSchema;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ValidateIf((dto: CreateAnalysisDto) => isDatabase(dto) && dto.host === undefined)
  @Transform(trim)
  @IsString()
  @Matches(POSTGRES_URL_PATTERN)
  @MaxLength(2048)
  connectionString?: string;

  @ValidateIf((dto: CreateAnalysisDto) => isDatabase(dto) && dto.connectionString === undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ValidateIf((dto: CreateAnalysisDto) => isDatabase(dto) && dto.connectionString === undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  database?: string;

  @ValidateIf((dto: CreateAnalysisDto) => isDatabase(dto) && dto.connectionString === undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  user?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  password?: string;
}
