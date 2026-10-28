import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiTags,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { LOG_FILE_FIELDS, MAX_LOG_FILE_SIZE } from "./analyses.constants";
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
      required: ["branch"],
      properties: {
        branch: { type: "string", minLength: 1, maxLength: 255 },
        mergeRequestIid: { type: "integer", minimum: 1 },
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
}
