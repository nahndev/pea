import { UserSortField } from '@tomato/constants';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListUsersQueryDto {
  @IsOrdering(UserSortField)
  ordering?: Ordering<UserSortField>;
}
