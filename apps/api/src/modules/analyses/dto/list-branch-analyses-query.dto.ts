import { AnalysisSchema, AnalysisSortField } from '@tomato/constants';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListBranchAnalysesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema: AnalysisSchema = AnalysisSchema.API;

  @IsOrdering(AnalysisSortField)
  ordering?: Ordering<AnalysisSortField>;
}
