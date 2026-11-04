import { useMutation } from '@tanstack/react-query';
import type { ConvertExceptionsInput } from '../leaneo-exceptions-convert.schemas';
import { leaneoExceptionsConvertService } from '../services/leaneo-exceptions-convert.service';

export const useConvertExceptions = () =>
  useMutation({ mutationFn: ({ file }: ConvertExceptionsInput) => leaneoExceptionsConvertService.convert(file) });
