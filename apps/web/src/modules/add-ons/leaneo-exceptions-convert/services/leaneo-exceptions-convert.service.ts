import { AddOnHeader } from '@tomato/constants';
import { apiClient } from '@/shared/lib/api-client';
import { decodeBlobError } from '../../services/decode-blob-error';
import type { ConvertExceptionsResult } from '../leaneo-exceptions-convert.types';

export const leaneoExceptionsConvertService = {
  async convert(file: File): Promise<ConvertExceptionsResult> {
    const body = new FormData();
    body.set('file', file);
    try {
      const { data, headers } = await apiClient.post<Blob>('/add-ons/leaneo-exceptions-convert', body, { responseType: 'blob' });
      return {
        blob: data,
        converted: Number(headers[AddOnHeader.CONVERTED_COUNT] ?? 0),
        skipped: Number(headers[AddOnHeader.SKIPPED_COUNT] ?? 0),
      };
    } catch (error) {
      await decodeBlobError(error);
      throw error;
    }
  },
};
