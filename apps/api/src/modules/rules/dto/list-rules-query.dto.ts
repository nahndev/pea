import { RuleType } from '@tomato/constants';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListRulesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(RuleType))
  type?: RuleType;
}
