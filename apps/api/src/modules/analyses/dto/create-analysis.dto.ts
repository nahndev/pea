import { Type } from 'class-transformer';
import { IsHexadecimal, IsInt, Length, Min } from 'class-validator';

export class CreateAnalysisDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  iid: number;

  @IsHexadecimal()
  @Length(40, 64)
  commitSha: string;
}
