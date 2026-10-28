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
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { UploadService } from "../files/upload.service";
import {
  LOG_FILE_FIELD,
  MAX_LOG_FILE_COUNT,
  MAX_LOG_FILE_SIZE,
} from "./analyses.constants";
import { AnalysesService } from "./analyses.service";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { ListAnalysesQueryDto } from "./dto/list-analyses-query.dto";

@ApiTags("analyses")
@Controller("analyses")
export class AnalysesController {
  constructor(
    private readonly analysesService: AnalysesService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["iid", "commitSha", LOG_FILE_FIELD],
      properties: {
        iid: { type: "integer", minimum: 1 },
        commitSha: { type: "string", minLength: 40, maxLength: 64 },
        [LOG_FILE_FIELD]: {
          type: "array",
          maxItems: MAX_LOG_FILE_COUNT,
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @UseInterceptors(
    FilesInterceptor(LOG_FILE_FIELD, MAX_LOG_FILE_COUNT, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOG_FILE_SIZE },
    }),
  )
  async create(
    @Body() dto: CreateAnalysisDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const contextFiles = await this.uploadService.save(files);
    return this.analysesService.create(dto, contextFiles);
  }

  @Get()
  @ApiOkResponse()
  findAll(@Query() query: ListAnalysesQueryDto) {
    return this.analysesService.findAll(query);
  }

  @Get(":id")
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.analysesService.findOne(id);
  }
}
