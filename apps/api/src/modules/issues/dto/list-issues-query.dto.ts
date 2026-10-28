import { IsIn, IsOptional } from 'class-validator';
import { IssueStatus, RuleType } from '@tomato/constants';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListIssuesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(IssueStatus))
  status?: IssueStatus;

  @IsOptional()
  @IsIn(Object.values(RuleType))
  ruleType?: RuleType;
}
