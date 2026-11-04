import { isAxiosError } from 'axios';

// With responseType blob, the error body is a Blob too; decode it so getApiError can read the code.
export async function decodeBlobError(error: unknown) {
  if (!isAxiosError(error) || !(error.response?.data instanceof Blob)) return;
  try {
    error.response.data = JSON.parse(await error.response.data.text());
  } catch {
    return;
  }
}
