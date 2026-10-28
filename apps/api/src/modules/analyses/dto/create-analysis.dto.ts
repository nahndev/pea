import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  branch: string;
}
