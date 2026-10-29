import { AnalysisSchema, RuleType, Severity } from '@tomato/constants';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsObject, IsString, MaxLength, ValidateNested } from 'class-validator';
import { RuleConfigDto } from './rule-config.dto';

export class CreateRuleDto {
  @IsIn(Object.values(AnalysisSchema))
  schema: AnalysisSchema;

  @IsIn(Object.values(RuleType))
  type: RuleType;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsIn(Object.values(Severity))
  severity: Severity;

  @IsObject()
  @ValidateNested()
  @Type(() => RuleConfigDto)
  config: RuleConfigDto;
}
