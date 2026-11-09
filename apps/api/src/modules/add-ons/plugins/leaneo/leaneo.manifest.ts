import { AnalysisSchema } from '@tomato/constants';
import type { AddOnManifest } from '@tomato/types';

export const LeaneoConverter = {
  SLOW_API: 'slow-api',
  EXCEPTIONS: 'exceptions',
} as const;

export type LeaneoConverter = (typeof LeaneoConverter)[keyof typeof LeaneoConverter];

export const LEANEO_MANIFEST: AddOnManifest = {
  id: 'leaneo',
  version: '1.0.0',
  label: 'Leaneo',
  description: 'Upload Leaneo logs as they are; they are converted to the analysis format on upload.',
  converters: [
    {
      id: LeaneoConverter.SLOW_API,
      schemas: [AnalysisSchema.API, AnalysisSchema.QUERY],
      input: 'slow_api.log',
      hint: 'JSON Lines with context.request.url, context.request.method and context.elapsedMilleSecond.',
    },
    {
      id: LeaneoConverter.EXCEPTIONS,
      schemas: [AnalysisSchema.BUG],
      input: 'exceptions.log',
      hint: 'Monolog JSON Lines with message, level_name, datetime and context.exception. Personal data is dropped.',
    },
  ],
};
