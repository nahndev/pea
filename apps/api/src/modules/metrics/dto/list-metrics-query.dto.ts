import { AnalysisSchema, MetricSortField } from '@tomato/constants';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListMetricsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema?: AnalysisSchema;

  @IsOrdering(MetricSortField)
  ordering?: Ordering<MetricSortField>;
}
