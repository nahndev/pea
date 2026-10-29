import { AnalysisSchema } from '@tomato/constants';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListBranchAnalysesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(AnalysisSchema))
  schema: AnalysisSchema = AnalysisSchema.API;
}
