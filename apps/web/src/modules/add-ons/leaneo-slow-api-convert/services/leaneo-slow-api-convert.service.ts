import { isAxiosError } from 'axios';
import { AddOnHeader } from '@tomato/constants';
import { apiClient } from '@/shared/lib/api-client';
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

// With responseType blob, the error body is a Blob too; decode it so getApiError can read the code.
async function decodeBlobError(error: unknown) {
  if (!isAxiosError(error) || !(error.response?.data instanceof Blob)) return;
  try {
    error.response.data = JSON.parse(await error.response.data.text());
  } catch {
    return;
  }
}
