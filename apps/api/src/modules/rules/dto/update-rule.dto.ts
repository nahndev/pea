import { Severity } from '@tomato/constants';
import { IsIn, IsOptional } from 'class-validator';
import { RuleConfigDto } from './rule-config.dto';

export class UpdateRuleDto extends RuleConfigDto {
  @IsOptional()
  @IsIn(Object.values(Severity))
  severity?: Severity;
}
