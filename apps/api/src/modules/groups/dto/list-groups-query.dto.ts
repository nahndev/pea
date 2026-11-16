import { GroupSortField } from '@tomato/constants';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListGroupsQueryDto {
  @IsOrdering(GroupSortField)
  ordering?: Ordering<GroupSortField>;
}
