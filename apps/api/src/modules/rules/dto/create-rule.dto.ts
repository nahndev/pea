import { RuleType } from '@tomato/constants';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateRuleDto {
  @IsIn(Object.values(RuleType))
  type: RuleType;

  @IsString()
  @IsNotEmpty()
  description: string;
}
