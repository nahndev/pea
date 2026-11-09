import type { AnalysisSchema } from '@tomato/constants';

/** One log format an add-on converts, for the listed schemas */
export interface AddOnConverterManifest {
  id: string;
  schemas: AnalysisSchema[];
  /** Name of the file to upload, e.g. `slow_api.log` */
  input: string;
  hint: string;
}

/** What an add-on declares about itself, like an extension `package.json` */
export interface AddOnManifest {
  id: string;
  version: string;
  label: string;
  description: string;
  converters: AddOnConverterManifest[];
}
