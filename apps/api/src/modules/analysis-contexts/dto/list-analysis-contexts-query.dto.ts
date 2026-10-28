import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAnalysisContextsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  analysisId?: string;
}
