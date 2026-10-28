import { RuleType } from '@tomato/constants';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import type { Prisma } from '../../../generated/client';

export class CreateRuleDto {
  @IsIn(Object.values(RuleType))
  type: RuleType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsObject()
  config?: Prisma.InputJsonObject;
}
