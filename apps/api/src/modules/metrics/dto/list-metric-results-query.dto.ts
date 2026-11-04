import { MetricResultSortField, MetricType } from '@tomato/constants';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListMetricResultsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(MetricType))
  metricType?: MetricType;

  @IsOptional()
  @IsUUID()
  subjectUuid?: string;

  @IsOrdering(MetricResultSortField)
  ordering?: Ordering<MetricResultSortField>;
}
