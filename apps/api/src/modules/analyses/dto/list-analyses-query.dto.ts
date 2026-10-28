import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAnalysesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  mergeRequestId?: string;
}
