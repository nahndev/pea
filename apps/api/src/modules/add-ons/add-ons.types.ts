import type { AnalysisSchema } from '@tomato/constants';
import type { AddOnManifest } from '@tomato/types';

export type LogAnalysisSchema = Exclude<AnalysisSchema, typeof AnalysisSchema.DATABASE>;

/** One input line → one output record, `null` to skip the line */
export type LineConverter = (line: string) => object | null;

/** Default export of `plugins/<id>/index.ts` */
export interface AddOnPlugin {
  manifest: AddOnManifest;
  /** Implementation of each `manifest.converters[].id` */
  converters: Record<string, LineConverter>;
}

export interface ConvertCounts {
  converted: number;
  skipped: number;
}
