import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { AnalysesService } from './analyses.service';
import { LOG_FILE_FIELD, MAX_LOG_FILE_COUNT, MAX_LOG_FILE_SIZE } from './analyses.constants';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { ListAnalysesQueryDto } from './dto/list-analyses-query.dto';
import { Analysis, AnalysisWithContexts } from './entities/analysis.entity';

@ApiTags('analyses')
@Controller('analyses')
export class AnalysesController {
  constructor(private readonly service: AnalysesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['iid', 'commitSha', LOG_FILE_FIELD],
      properties: {
        iid: { type: 'integer', minimum: 1 },
        commitSha: { type: 'string', minLength: 40, maxLength: 64 },
        [LOG_FILE_FIELD]: {
          type: 'array',
          maxItems: MAX_LOG_FILE_COUNT,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiCreatedResponse({ type: AnalysisWithContexts })
  @ApiBadRequestResponse()
  @UseInterceptors(
    FilesInterceptor(LOG_FILE_FIELD, MAX_LOG_FILE_COUNT, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOG_FILE_SIZE },
    }),
  )
  create(@Body() dto: CreateAnalysisDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.service.create(dto, files);
  }

  @Get()
  @ApiPaginatedResponse(Analysis)
  findAll(@Query() query: ListAnalysesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: AnalysisWithContexts })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
