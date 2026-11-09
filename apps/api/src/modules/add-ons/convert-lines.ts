import type { Readable } from 'node:stream';
import { createInterface } from 'node:readline';
import type { ConvertCounts, LineConverter } from './add-ons.types';

/** Streams `input` line by line through `converter` as NDJSON, counting into `counts` */
export async function* convertLines(converter: LineConverter, input: Readable, counts: ConvertCounts): AsyncGenerator<string> {
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    if (!line.trim()) continue;
    let record: object | null;
    try {
      record = converter(line);
    } catch {
      record = null;
    }
    if (!record) {
      counts.skipped += 1;
      continue;
    }
    counts.converted += 1;
    yield `${JSON.stringify(record)}\n`;
  }
}
