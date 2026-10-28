import { AnalysisContextType } from '@tomato/constants';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAnalysisContextsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  analysisId?: string;

  @IsOptional()
  @IsIn(Object.values(AnalysisContextType))
  type?: AnalysisContextType;
}
