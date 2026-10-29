import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
import { LOG_FILE_FIELD, MAX_LOG_FILE_SIZE } from "./analyses.constants";
import { AnalysesService } from "./analyses.service";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";

@ApiTags("analyses")
@Controller("analyses")
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["branch", LOG_FILE_FIELD],
      properties: {
        branch: { type: "string", minLength: 1, maxLength: 255 },
        mergeRequestIid: { type: "integer", minimum: 1 },
        [LOG_FILE_FIELD]: { type: "string", format: "binary" },
      },
    },
  })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @UseInterceptors(
    FileInterceptor(LOG_FILE_FIELD, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOG_FILE_SIZE },
    }),
  )
  create(
    @Body() dto: CreateAnalysisDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.analysesService.create(dto, file);
  }

  @Get(":id")
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.analysesService.findDetail(id);
  }
}
