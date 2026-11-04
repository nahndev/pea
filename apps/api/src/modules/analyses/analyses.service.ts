import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AnalysisEvent,
  type AnalysisResultStatus,
  AnalysisSchema,
  ErrorCode,
  MetricEvaluationStatus,
  type MetricType,
  type MetricUnit,
  type SubjectType,
} from "@tomato/constants";
import type {
  AnalysisCountBySchema,
  AnalysisDetail,
  AnalysisResultSummary,
  AnalysisSummary,
  MetricTrend,
  MetricTrendPoint,
  MetricTrendSeries,
  Paginated,
} from "@tomato/types";
import type { Analysis } from "../../generated/client";
import { EmitEvent } from "../../common/decorators/emit-event.decorator";
import { BranchesService } from "../branches/branches.service";
import { DatabasesService } from "../databases/databases.service";
import { StorageService } from "../files/storage.service";
import { DEFAULT_TREND_METRIC_TYPES, LOG_FILE_FIELD_BY_SCHEMA } from "./analyses.constants";
import { AnalysesRepository } from "./analyses.repository";
import type { AnalysisWithData, AnalysisWithLatestResult, MetricTrendPick, UploadedLogFiles } from "./analyses.types";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { ListBranchAnalysesQueryDto } from "./dto/list-branch-analyses-query.dto";

@Injectable()
export class AnalysesService {
  constructor(
    private readonly analysesRepository: AnalysesRepository,
    private readonly branchesService: BranchesService,
    private readonly storageService: StorageService,
    private readonly databasesService: DatabasesService,
  ) {}

  @EmitEvent(AnalysisEvent.CREATED)
  async create(dto: CreateAnalysisDto, files: UploadedLogFiles = {}): Promise<Analysis> {
    const { branch, schema, title, databaseId } = dto;
    if (schema === AnalysisSchema.DATABASE) {
      await this.databasesService.verify(databaseId!);
      const { id: branchId } = await this.branchesService.findOrCreateByName(branch);
      return this.analysesRepository.create({ branchId, schema, title, databaseId });
    }
    const upload = files[LOG_FILE_FIELD_BY_SCHEMA[schema]]?.[0];
    if (!upload)
      throw new BadRequestException({ code: ErrorCode.LOG_FILE_REQUIRED });
    const { id: branchId } = await this.branchesService.findOrCreateByName(branch);
    const file = await this.storageService.save(upload);
    try {
      return await this.analysesRepository.create({ branchId, schema, title, file });
    } catch (error) {
      await this.storageService.remove([file]).catch(() => undefined);
      throw error;
    }
  }

  async findOne(id: string): Promise<AnalysisWithData> {
    const analysis = await this.analysesRepository.findById(id);
    if (!analysis)
      throw new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND });
    return analysis;
  }

  async findDetail(id: string): Promise<AnalysisDetail> {
    const analysis = await this.analysesRepository.findDetailById(id);
    if (!analysis)
      throw new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND });
    const { branch, apiData, databaseData } = analysis;
    return {
      ...this.toSummary(analysis),
      branch: { id: branch.id, name: branch.name },
      file: apiData?.file ?? null,
      database: databaseData ? this.databasesService.toSummary(databaseData.database) : null,
    };
  }

  async findByBranch(
    branchId: string,
    { schema, limit, offset, ordering }: ListBranchAnalysesQueryDto,
  ): Promise<Paginated<AnalysisSummary>> {
    await this.branchesService.findOne(branchId);
    const { items, total } = await this.analysesRepository.findPageByBranch(branchId, schema, limit, offset, ordering);
    return { items: items.map((analysis) => this.toSummary(analysis)), total };
  }

  async countByBranch(branchId: string): Promise<AnalysisCountBySchema> {
    await this.branchesService.findOne(branchId);
    const groups = await this.analysesRepository.countBySchema(branchId);
    const counts = Object.fromEntries(Object.values(AnalysisSchema).map((schema) => [schema, 0])) as AnalysisCountBySchema;
    for (const { schema, _count } of groups)
      if (schema in counts) counts[schema as AnalysisSchema] = _count._all;
    return counts;
  }

  async getMetricTrend(branchId: string, schema: AnalysisSchema, limit: number, picks: string[] = []): Promise<MetricTrend> {
    await this.branchesService.findOne(branchId);
    const pickList = picks.map((pick) => this.parsePick(pick));
    const analyses = await this.analysesRepository.findRecentByBranch(branchId, schema, limit, pickList);

    const seriesByKey = new Map<string, MetricTrendSeries>();
    const points = analyses.reverse().map(({ id, createdAt, title, results }) => {
      const values: MetricTrendPoint["values"] = {};
      for (const { value, subject, metric } of results[0]?.metricResults ?? []) {
        const key = `${metric.id}:${subject?.uuid ?? ""}`;
        if (!seriesByKey.has(key)) {
          seriesByKey.set(key, {
            key,
            metric: { ...metric, type: metric.type as MetricType, unit: metric.unit as MetricUnit },
            subject: subject && { ...subject, type: subject.type as SubjectType },
          });
        }
        values[key] = value;
      }
      return { analysisId: id, createdAt: createdAt.toISOString(), title, values };
    });

    return { series: this.sortSeries([...seriesByKey.values()], picks), points };
  }

  private parsePick(pick: string): MetricTrendPick {
    const separator = pick.indexOf(":");
    return { metricId: pick.slice(0, separator), subjectUuid: pick.slice(separator + 1) || null };
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
      schema: analysis.schema as AnalysisSchema,
      title: analysis.title,
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
}
