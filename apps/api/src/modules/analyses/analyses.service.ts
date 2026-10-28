import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AnalysisEvent, ErrorCode } from "@tomato/constants";
import { EmitEvent } from "../../common/decorators/emit-event.decorator";
import { BranchesService } from "../branches/branches.service";
import { StorageService } from "../files/storage.service";
import { CONTEXT_TYPE_BY_FIELD } from "./analyses.constants";
import { AnalysesRepository } from "./analyses.repository";
import type { AnalysisWithContexts } from "./analyses.types";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";

@Injectable()
export class AnalysesService {
  constructor(
    private readonly analysesRepository: AnalysesRepository,
    private readonly branchesService: BranchesService,
    private readonly storageService: StorageService,
  ) {}

  @EmitEvent(AnalysisEvent.CREATED)
  async create(
    { branch }: CreateAnalysisDto,
    filesByField: Record<string, Express.Multer.File[]> = {},
  ): Promise<AnalysisWithContexts> {
    const contextUploads = this.toContextUploads(filesByField);
    const { id: branchId } = await this.branchesService.findOrCreateByName(branch);
    const storedFiles = await this.storageService.saveMany(
      contextUploads.map(({ file }) => file),
    );
    try {
      return await this.analysesRepository.create({
        branchId,
        files: storedFiles.map((storedFile, index) => ({
          ...storedFile,
          type: contextUploads[index].type,
        })),
      });
    } catch (error) {
      await this.storageService.remove(storedFiles).catch(() => undefined);
      throw error;
    }
  }

  async findOne(id: string): Promise<AnalysisWithContexts> {
    const analysis = await this.analysesRepository.findById(id);
    if (!analysis)
      throw new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND });
    return analysis;
  }

  private toContextUploads(filesByField: Record<string, Express.Multer.File[]>) {
    return Object.entries(filesByField).flatMap(([field, files]) => {
      const type = CONTEXT_TYPE_BY_FIELD.get(field);
      if (!type)
        throw new BadRequestException({ code: ErrorCode.LOG_FILE_INVALID });
      return files.map((file) => ({ type, file }));
    });
  }
}
