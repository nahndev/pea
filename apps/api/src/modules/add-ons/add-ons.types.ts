import type { AnalysisSchema } from '@tomato/constants';

export interface ConvertResult {
  content: string;
  converted: number;
  skipped: number;
}

export type LogAnalysisSchema = Exclude<AnalysisSchema, typeof AnalysisSchema.DATABASE>;

export interface LogConverter {
  convert(file: Express.Multer.File): ConvertResult;
}
