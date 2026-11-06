import { Injectable } from '@nestjs/common';
import { AddOn, AnalysisSchema } from '@tomato/constants';
import type { LogAnalysisSchema, LogConverter } from './add-ons.types';
import { LeaneoExceptionsConvertService } from './leaneo-exceptions-convert/leaneo-exceptions-convert.service';
import { LeaneoSlowApiConvertService } from './leaneo-slow-api-convert/leaneo-slow-api-convert.service';

@Injectable()
export class AddOnsService {
  private readonly converters: Record<AddOn, Record<LogAnalysisSchema, LogConverter>>;

  constructor(leaneoSlowApiConvertService: LeaneoSlowApiConvertService, leaneoExceptionsConvertService: LeaneoExceptionsConvertService) {
    this.converters = {
      [AddOn.LEANEO]: {
        [AnalysisSchema.API]: leaneoSlowApiConvertService,
        [AnalysisSchema.QUERY]: leaneoSlowApiConvertService,
        [AnalysisSchema.BUG]: leaneoExceptionsConvertService,
      },
    };
  }

  /** Converts an uploaded log to the format the schema reads */
  convert(addOn: AddOn, schema: LogAnalysisSchema, file: Express.Multer.File): Express.Multer.File {
    const { content } = this.converters[addOn][schema].convert(file);
    const buffer = Buffer.from(content);
    return { ...file, buffer, size: buffer.length };
  }
}
