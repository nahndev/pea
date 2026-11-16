import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { MAX_BULK_ANALYSES } from '../analyses.constants';
import { CreateAnalysisDto } from './create-analysis.dto';

const isSparse = (value: unknown) => Array.isArray(value) && Object.keys(value).length !== value.length;

export class CreateAnalysesDto {
  /** Sparse indexes are rejected so `analyses[i]` keeps matching its uploaded files */
  @Transform(({ obj, value }: { obj: { analyses?: unknown }; value: unknown }) => (isSparse(obj.analyses) ? null : value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_ANALYSES)
  @ValidateNested({ each: true })
  @Type(() => CreateAnalysisDto)
  analyses: CreateAnalysisDto[];
}
