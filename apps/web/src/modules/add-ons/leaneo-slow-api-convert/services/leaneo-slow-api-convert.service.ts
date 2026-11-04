import { AddOnHeader } from '@tomato/constants';
import { apiClient } from '@/shared/lib/api-client';
import { decodeBlobError } from '../../services/decode-blob-error';
import type { ConvertSlowApiResult } from '../leaneo-slow-api-convert.types';

export const leaneoSlowApiConvertService = {
  async convert(file: File): Promise<ConvertSlowApiResult> {
    const body = new FormData();
    body.set('file', file);
    try {
      const { data, headers } = await apiClient.post<Blob>('/add-ons/leaneo-slow-api-convert', body, { responseType: 'blob' });
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
