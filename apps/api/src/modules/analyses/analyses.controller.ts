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
import { FileFieldsInterceptor } from "@nestjs/platform-express";
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
import { LOG_FILE_FIELDS, MAX_LOG_FILE_SIZE } from "./analyses.constants";
import { AnalysesService } from "./analyses.service";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { ListAnalysesQueryDto } from "./dto/list-analyses-query.dto";

@ApiTags("analyses")
@Controller("analyses")
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["iid", "commitSha"],
      properties: {
        iid: { type: "integer", minimum: 1 },
        commitSha: { type: "string", minLength: 40, maxLength: 64 },
        ...Object.fromEntries(
          LOG_FILE_FIELDS.map(({ name }) => [
            name,
            { type: "string", format: "binary" },
          ]),
        ),
      },
    },
  })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @UseInterceptors(
    FileFieldsInterceptor(LOG_FILE_FIELDS, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOG_FILE_SIZE },
    }),
  )
  create(
    @Body() dto: CreateAnalysisDto,
    @UploadedFiles() filesByField: Record<string, Express.Multer.File[]>,
  ) {
    return this.analysesService.create(dto, filesByField);
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
