import { MetricType } from '@tomato/constants';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListMetricResultsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(MetricType))
  metricType?: MetricType;

  @IsOptional()
  @IsUUID()
  subjectUuid?: string;
}
