import { IssueStatus } from '@tomato/constants';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListIssuesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @IsOptional()
  @IsUUID()
  analysisContextId?: string;

  @IsOptional()
  @IsUUID()
  analysisResultId?: string;

  @IsOptional()
  @IsIn(Object.values(IssueStatus))
  status?: IssueStatus;
}
