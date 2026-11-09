import { Readable } from 'node:stream';
import type { ConvertCounts, LineConverter } from './add-ons.types';
import { convertLines } from './convert-lines';

/** Runs a converter over `text` the way uploads are converted */
export const convertWith = async (converter: LineConverter, text: string): Promise<ConvertCounts & { content: string }> => {
  const counts: ConvertCounts = { converted: 0, skipped: 0 };
  let content = '';
  for await (const chunk of convertLines(converter, Readable.from([Buffer.from(text)]), counts)) content += chunk;
  return { ...counts, content };
};
