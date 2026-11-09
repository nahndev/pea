import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { AddOnManifest } from '@tomato/types';
import { Readable } from 'node:stream';
import { StorageService, type StoredFile } from '../files/storage.service';
import { AddOnRegistry } from './add-on.registry';
import type { ConvertCounts, LogAnalysisSchema } from './add-ons.types';
import { convertLines } from './convert-lines';

@Injectable()
export class AddOnsService {
  constructor(
    private readonly addOnRegistry: AddOnRegistry,
    private readonly storageService: StorageService,
  ) {}

  list(): AddOnManifest[] {
    return this.addOnRegistry.list();
  }

  /** Converts an uploaded log to the format the schema reads and stores it */
  async convert(addOnId: string, schema: LogAnalysisSchema, upload: Express.Multer.File): Promise<StoredFile> {
    const converter = this.addOnRegistry.converterFor(addOnId, schema);
    const counts: ConvertCounts = { converted: 0, skipped: 0 };
    const output = Readable.from(convertLines(converter, this.storageService.open(upload), counts));
    const stored = await this.storageService.saveStream(upload.originalname, output);
    if (counts.converted === 0) {
      await this.storageService.remove([stored]);
      throw new BadRequestException({ code: ErrorCode.LOG_FILE_INVALID });
    }
    return stored;
  }
}
