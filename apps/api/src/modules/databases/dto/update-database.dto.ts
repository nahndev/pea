import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { POSTGRES_URL_PATTERN } from '../databases.constants';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Fields replace the connection as a whole; a missing password keeps the current one of the same server. */
const usesFields = ({ connectionString, host, port, database, user, password }: UpdateDatabaseDto) =>
  connectionString === undefined && [host, port, database, user, password].some((value) => value !== undefined);

export class UpdateDatabaseDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(POSTGRES_URL_PATTERN)
  @MaxLength(2048)
  connectionString?: string;

  @ValidateIf(usesFields)
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

  @ValidateIf(usesFields)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  database?: string;

  @ValidateIf(usesFields)
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
