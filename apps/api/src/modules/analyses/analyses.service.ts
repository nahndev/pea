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
  type MetricUnit,
} from "@tomato/constants";
import type {
  AnalysisDetail,
  AnalysisResultSummary,
  AnalysisSummary,
  MetricTrend,
  MetricTrendPoint,
  MetricTrendSeries,
  Paginated,
} from "@tomato/types";
import { EmitEvent } from "../../common/decorators/emit-event.decorator";
import { BranchesService } from "../branches/branches.service";
import { StorageService } from "../files/storage.service";
import { CONTEXT_TYPE_BY_FIELD, DEFAULT_TREND_METRIC_TYPES } from "./analyses.constants";
import { AnalysesRepository } from "./analyses.repository";
import type { AnalysisWithContexts, AnalysisWithLatestResult, MetricTrendPick } from "./analyses.types";
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

  async getMetricTrend(branchId: string, limit: number, picks: string[] = []): Promise<MetricTrend> {
    await this.branchesService.findOne(branchId);
    const pickList = picks.map((pick) => this.parsePick(pick));
    const analyses = await this.analysesRepository.findRecentByBranch(branchId, limit, pickList);

    const seriesByKey = new Map<string, MetricTrendSeries>();
    const points = analyses.reverse().map(({ id, createdAt, mergeRequestIid, results }) => {
      const sums = new Map<string, { total: number; count: number }>();
      for (const { value, subject, metric } of results[0]?.metricResults ?? []) {
        const key = `${metric.id}:${subject}`;
        if (!seriesByKey.has(key)) {
          seriesByKey.set(key, {
            key,
            metric: { ...metric, type: metric.type as MetricType, unit: metric.unit as MetricUnit },
            subject,
          });
        }
        const sum = sums.get(key) ?? { total: 0, count: 0 };
        sums.set(key, { total: sum.total + value, count: sum.count + 1 });
      }
      const values: MetricTrendPoint["values"] = {};
      for (const [key, { total, count }] of sums) values[key] = total / count;
      return { analysisId: id, createdAt: createdAt.toISOString(), mergeRequestIid, values };
    });

    return { series: this.sortSeries([...seriesByKey.values()], picks), points };
  }

  private parsePick(pick: string): MetricTrendPick {
    const separator = pick.indexOf(":");
    return { metricId: pick.slice(0, separator), subject: pick.slice(separator + 1) };
  }

  private sortSeries(series: MetricTrendSeries[], picks: string[]): MetricTrendSeries[] {
    const rank = (item: MetricTrendSeries) => {
      const index = picks.length ? picks.indexOf(item.key) : DEFAULT_TREND_METRIC_TYPES.indexOf(item.metric.type);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return series.sort((a, b) => rank(a) - rank(b));
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
