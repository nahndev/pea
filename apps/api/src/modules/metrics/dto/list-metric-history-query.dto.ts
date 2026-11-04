import { MetricHistorySortField } from '@tomato/constants';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListMetricHistoryQueryDto extends PaginationQueryDto {
  @IsOrdering(MetricHistorySortField)
  ordering?: Ordering<MetricHistorySortField>;
}
