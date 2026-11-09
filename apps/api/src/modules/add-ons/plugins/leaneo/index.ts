import type { AddOnPlugin } from '../../add-ons.types';
import { convertExceptionLine } from './exceptions.converter';
import { LEANEO_MANIFEST, LeaneoConverter } from './leaneo.manifest';
import { convertSlowApiLine } from './slow-api.converter';

const plugin: AddOnPlugin = {
  manifest: LEANEO_MANIFEST,
  converters: {
    [LeaneoConverter.SLOW_API]: convertSlowApiLine,
    [LeaneoConverter.EXCEPTIONS]: convertExceptionLine,
  },
};

export default plugin;
