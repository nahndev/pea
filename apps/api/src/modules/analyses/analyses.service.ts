import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalysisContextType, ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import type { Analysis } from '../../generated/client';
import { UploadService } from '../files/upload.service';
import type { UploadedFile } from '../files/upload.service';
import { MergeRequestsService } from '../merge-requests/merge-requests.service';
import { AnalysesRepository } from './analyses.repository';
import type { AnalysisWithContexts } from './analyses.types';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { ListAnalysesQueryDto } from './dto/list-analyses-query.dto';

@Injectable()
export class AnalysesService {
  constructor(
    private readonly repository: AnalysesRepository,
    private readonly mergeRequestsService: MergeRequestsService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    { iid, commitSha }: CreateAnalysisDto,
    uploadedFiles: UploadedFile[],
  ): Promise<AnalysisWithContexts> {
    try {
      const mergeRequest = await this.mergeRequestsService.findOrCreateByIid(iid);
      return await this.repository.create({
        mergeRequestId: mergeRequest.id,
        commitSha,
        files: uploadedFiles.map((uploadedFile) => ({
          ...uploadedFile,
          type: AnalysisContextType.API_METRIC,
        })),
      });
    } catch (error) {
      await this.uploadService.remove(uploadedFiles).catch(() => undefined);
      throw error;
    }
  }

  findAll({ mergeRequestId, limit, offset }: ListAnalysesQueryDto): Promise<Paginated<Analysis>> {
    return this.repository.findMany(mergeRequestId, limit, offset);
  }

  async findOne(id: string): Promise<AnalysisWithContexts> {
    const analysis = await this.repository.findById(id);
    if (!analysis) throw new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND });
    return analysis;
  }
}
