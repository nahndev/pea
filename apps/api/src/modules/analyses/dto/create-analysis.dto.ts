import { AnalysisSchema } from '@tomato/constants';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

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

  @ValidateIf(isDatabase)
  @IsUUID()
  databaseId?: string;
}
