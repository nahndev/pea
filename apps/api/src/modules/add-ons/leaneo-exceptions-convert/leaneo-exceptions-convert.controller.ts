import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddOnHeader } from '@tomato/constants';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { MAX_ADD_ON_FILE_SIZE } from '../add-ons.constants';
import { OUTPUT_FILE_NAME } from './leaneo-exceptions-convert.constants';
import { LeaneoExceptionsConvertService } from './leaneo-exceptions-convert.service';

@ApiTags('add-ons')
@Controller('add-ons/leaneo-exceptions-convert')
export class LeaneoExceptionsConvertController {
  constructor(private readonly leaneoExceptionsConvertService: LeaneoExceptionsConvertService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiOkResponse({ description: 'bug_log NDJSON file (docs/bug_log.md)' })
  @ApiBadRequestResponse()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_ADD_ON_FILE_SIZE } }))
  convert(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const { content, converted, skipped } = this.leaneoExceptionsConvertService.convert(file);
    response.set({
      [AddOnHeader.CONVERTED_COUNT]: String(converted),
      [AddOnHeader.SKIPPED_COUNT]: String(skipped),
    });
    return new StreamableFile(Buffer.from(content), {
      type: 'application/x-ndjson',
      disposition: `attachment; filename="${OUTPUT_FILE_NAME}"`,
    });
  }
}
