import { IsIn, IsOptional } from 'class-validator';
import { IssueSortField, IssueSubjectStatus, RuleType, Severity } from '@tomato/constants';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListIssuesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(IssueSubjectStatus))
  status?: IssueSubjectStatus;

  @IsOptional()
  @IsIn(Object.values(Severity))
  severity?: Severity;

  @IsOptional()
  @IsIn(Object.values(RuleType))
  ruleType?: RuleType;

  @IsOrdering(IssueSortField)
  ordering?: Ordering<IssueSortField>;
}
