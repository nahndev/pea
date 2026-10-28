import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AnalysisEvent,
  type AnalysisContextType,
  type AnalysisResultStatus,
  ErrorCode,
  MetricEvaluationStatus,
  type MetricType,
} from "@tomato/constants";
import type {
  AnalysisDetail,
  AnalysisResultSummary,
  AnalysisSummary,
  MetricTrendPoint,
  Paginated,
} from "@tomato/types";
import { EmitEvent } from "../../common/decorators/emit-event.decorator";
import { BranchesService } from "../branches/branches.service";
import { StorageService } from "../files/storage.service";
import { CONTEXT_TYPE_BY_FIELD } from "./analyses.constants";
import { AnalysesRepository } from "./analyses.repository";
import type { AnalysisWithContexts, AnalysisWithLatestResult } from "./analyses.types";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@Injectable()
export class AnalysesService {
  constructor(
    private readonly analysesRepository: AnalysesRepository,
    private readonly branchesService: BranchesService,
    private readonly storageService: StorageService,
  ) {}

  @EmitEvent(AnalysisEvent.CREATED)
  async create(
    { branch, mergeRequestIid }: CreateAnalysisDto,
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
        mergeRequestIid,
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

  async findDetail(id: string): Promise<AnalysisDetail> {
    const analysis = await this.analysesRepository.findDetailById(id);
    if (!analysis)
      throw new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND });
    const { branch, contexts } = analysis;
    return {
      ...this.toSummary(analysis),
      branch: { id: branch.id, name: branch.name },
      contexts: contexts.map(({ id: contextId, file, type }) => ({
        id: contextId,
        file,
        type: type as AnalysisContextType,
      })),
    };
  }

  async findByBranch(
    branchId: string,
    { limit, offset }: PaginationQueryDto,
  ): Promise<Paginated<AnalysisSummary>> {
    await this.branchesService.findOne(branchId);
    const { items, total } = await this.analysesRepository.findPageByBranch(branchId, limit, offset);
    return { items: items.map((analysis) => this.toSummary(analysis)), total };
  }

  async getMetricTrend(branchId: string, limit: number): Promise<MetricTrendPoint[]> {
    await this.branchesService.findOne(branchId);
    const analyses = await this.analysesRepository.findRecentByBranch(branchId, limit);
    return analyses.reverse().map(({ id, createdAt, mergeRequestIid, results }) => {
      const sums = new Map<MetricType, { total: number; count: number }>();
      for (const { value, metric } of results[0]?.metricResults ?? []) {
        const type = metric.type as MetricType;
        const sum = sums.get(type) ?? { total: 0, count: 0 };
        sums.set(type, { total: sum.total + value, count: sum.count + 1 });
      }
      const values: MetricTrendPoint["values"] = {};
      for (const [type, { total, count }] of sums) values[type] = total / count;
      return { analysisId: id, createdAt: createdAt.toISOString(), mergeRequestIid, values };
    });
  }

  private toSummary(analysis: AnalysisWithLatestResult): AnalysisSummary {
    const [result] = analysis.results;
    return {
      id: analysis.id,
      mergeRequestIid: analysis.mergeRequestIid,
      createdAt: analysis.createdAt.toISOString(),
      latestResult: result ? this.toResultSummary(result) : null,
    };
  }

  private toResultSummary(result: AnalysisWithLatestResult["results"][number]): AnalysisResultSummary {
    const statuses = result.metricResults.flatMap(({ evaluations }) => evaluations.map(({ status }) => status));
    let gateStatus: AnalysisResultSummary["gateStatus"] = null;
    if (statuses.length)
      gateStatus = statuses.includes(MetricEvaluationStatus.FAILED)
        ? MetricEvaluationStatus.FAILED
        : MetricEvaluationStatus.PASSED;
    return {
      id: result.id,
      status: result.status as AnalysisResultStatus,
      issueCount: result.issueCount,
      gateStatus,
    };
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
