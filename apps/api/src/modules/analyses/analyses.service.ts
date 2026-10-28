import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import { LOG_FILE_NAME_PATTERN } from '../analysis-contexts/analysis-contexts.constants';
import { LogStorageService } from '../analysis-contexts/log-storage.service';
import { MergeRequestsService } from '../merge-requests/merge-requests.service';
import { AnalysesRepository } from './analyses.repository';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { ListAnalysesQueryDto } from './dto/list-analyses-query.dto';
import { Analysis, AnalysisWithContexts } from './entities/analysis.entity';

@Injectable()
export class AnalysesService {
  constructor(
    private readonly repository: AnalysesRepository,
    private readonly mergeRequestsService: MergeRequestsService,
    private readonly logStorage: LogStorageService,
  ) {}

  async create(
    { iid, commitSha }: CreateAnalysisDto,
    uploads: Express.Multer.File[] = [],
  ): Promise<AnalysisWithContexts> {
    const files = this.toLogFiles(uploads);

    const mergeRequest = await this.mergeRequestsService.findOrCreateByIid(iid);
    const analysis = await this.repository.create({
      mergeRequestId: mergeRequest.id,
      commitSha,
      files: files.map(({ file }) => file),
    });

    try {
      await this.logStorage.save(analysis.id, files);
    } catch (error) {
      await Promise.allSettled([this.repository.delete(analysis.id), this.logStorage.remove(analysis.id)]);
      throw error;
    }
    return analysis;
  }

  findAll({ mergeRequestId, limit, offset }: ListAnalysesQueryDto): Promise<Paginated<Analysis>> {
    return this.repository.findMany(mergeRequestId, limit, offset);
  }

  async findOne(id: string): Promise<AnalysisWithContexts> {
    const analysis = await this.repository.findById(id);
    if (!analysis) throw new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND });
    return analysis;
  }

  private toLogFiles(uploads: Express.Multer.File[]) {
    if (!uploads.length) throw new BadRequestException({ code: ErrorCode.LOG_FILE_REQUIRED });

    const names = new Set<string>();
    return uploads.map(({ originalname, buffer }) => {
      if (!LOG_FILE_NAME_PATTERN.test(originalname)) {
        throw new BadRequestException({ code: ErrorCode.LOG_FILE_INVALID });
      }
      if (names.has(originalname)) {
        throw new BadRequestException({ code: ErrorCode.LOG_FILE_DUPLICATED });
      }
      names.add(originalname);
      return { file: originalname, buffer };
    });
  }
}
