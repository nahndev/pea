import { BranchSortField } from '@tomato/constants';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListBranchesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOrdering(BranchSortField)
  ordering?: Ordering<BranchSortField>;
}
