import { DatabaseSortField } from '@tomato/constants';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListDatabasesQueryDto {
  @IsOrdering(DatabaseSortField)
  ordering?: Ordering<DatabaseSortField>;
}
