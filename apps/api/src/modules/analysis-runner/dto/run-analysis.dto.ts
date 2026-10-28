import { IsUUID } from 'class-validator';

export class RunAnalysisDto {
  @IsUUID()
  analysisId: string;
}
