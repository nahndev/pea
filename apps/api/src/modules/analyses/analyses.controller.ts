import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AnalysisSchema } from "@tomato/constants";
import { diskStorage } from "multer";
import { RemoveUploadsInterceptor } from "../../common/interceptors/remove-uploads.interceptor";
import { UPLOAD_TMP_DIR } from "../files/files.constants";
import { LogFileField, MAX_LOG_FILE_SIZE } from "./analyses.constants";
import { AnalysesService } from "./analyses.service";
import type { UploadedLogFiles } from "./analyses.types";
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
      required: ["branch", "schema", "title"],
      properties: {
        branch: { type: "string", minLength: 1, maxLength: 255 },
        schema: { type: "string", enum: Object.values(AnalysisSchema) },
        title: { type: "string", minLength: 1, maxLength: 255 },
        [LogFileField.API_METRIC]: { type: "string", format: "binary", description: "Required when schema is API or QUERY" },
        [LogFileField.BUG_LOG]: { type: "string", format: "binary", description: "Required when schema is BUG" },
        databaseId: { type: "string", format: "uuid", description: "Required when schema is DATABASE" },
        addOn: { type: "string", description: "Id of an add-on (GET /add-ons) converting the uploaded log from its format" },
      },
    },
  })
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @UseInterceptors(
    FileFieldsInterceptor(
      Object.values(LogFileField).map((name) => ({ name, maxCount: 1 })),
      { storage: diskStorage({ destination: UPLOAD_TMP_DIR }), limits: { fileSize: MAX_LOG_FILE_SIZE } },
    ),
    RemoveUploadsInterceptor,
  )
  create(
    @Body() dto: CreateAnalysisDto,
    @UploadedFiles() files?: UploadedLogFiles,
  ) {
    return this.analysesService.create(dto, files);
  }

  @Get(":id")
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.analysesService.findDetail(id);
  }
}
