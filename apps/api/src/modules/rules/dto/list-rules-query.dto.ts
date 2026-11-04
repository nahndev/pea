import { AnalysisSchema, RuleSortField } from '@tomato/constants';
import { IsIn, IsOptional } from 'class-validator';
import { IsOrdering } from '../../../common/decorators/is-ordering.decorator';
import type { Ordering } from '../../../common/sort/sort';

export class ListRulesQueryDto {
  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema?: AnalysisSchema;

  @IsOrdering(RuleSortField)
  ordering?: Ordering<RuleSortField>;
}
