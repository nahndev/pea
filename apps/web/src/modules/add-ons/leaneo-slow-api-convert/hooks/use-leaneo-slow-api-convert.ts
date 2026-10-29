import { useMutation } from '@tanstack/react-query';
import type { ConvertSlowApiInput } from '../leaneo-slow-api-convert.schemas';
import { leaneoSlowApiConvertService } from '../services/leaneo-slow-api-convert.service';

export const useConvertSlowApi = () =>
  useMutation({ mutationFn: ({ file }: ConvertSlowApiInput) => leaneoSlowApiConvertService.convert(file) });
