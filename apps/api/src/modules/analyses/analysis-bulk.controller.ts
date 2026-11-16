import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { diskStorage } from 'multer';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { RemoveUploadsInterceptor } from '../../common/interceptors/remove-uploads.interceptor';
import { UPLOAD_TMP_DIR } from '../files/files.constants';
import { MAX_BULK_ANALYSES, MAX_LOG_FILE_SIZE } from './analyses.constants';
import { AnalysesService } from './analyses.service';
import { CreateAnalysesDto } from './dto/create-analyses.dto';

@ApiTags('analyses')
@Controller('analysis-bulk')
@RequirePermission(Permission.BRANCH_ANALYSIS)
export class AnalysisBulkController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: `Up to ${MAX_BULK_ANALYSES} items, each with the fields of POST /analyses indexed as \`analyses[i][<field>]\`, e.g. \`analyses[0][branch]\`, \`analyses[0][api_metric]\` (file). All are created or none.`,
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({ destination: UPLOAD_TMP_DIR }),
      limits: { fileSize: MAX_LOG_FILE_SIZE, files: MAX_BULK_ANALYSES },
    }),
    RemoveUploadsInterceptor,
  )
  create(@Body() dto: CreateAnalysesDto, @UploadedFiles() files?: Express.Multer.File[]) {
    return this.analysesService.createMany(dto, files);
  }
}
