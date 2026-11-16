import {
  BadRequestException,
  HttpException,
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
import { AddOnsService } from "../add-ons/add-ons.service";
import { BranchesService } from "../branches/branches.service";
import { DatabasesService } from "../databases/databases.service";
import { StorageService, type StoredFile } from "../files/storage.service";
import { DEFAULT_TREND_METRIC_TYPES, LOG_FILE_FIELD_BY_SCHEMA } from "./analyses.constants";
import { AnalysesRepository, type CreateAnalysisData } from "./analyses.repository";
import type { AnalysisWithData, AnalysisWithLatestResult, MetricTrendPick, UploadedLogFiles } from "./analyses.types";
import { groupBulkLogFiles } from "./bulk-log-files";
import { CreateAnalysesDto } from "./dto/create-analyses.dto";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { ListBranchAnalysesQueryDto } from "./dto/list-branch-analyses-query.dto";

@Injectable()
export class AnalysesService {
  constructor(
    private readonly analysesRepository: AnalysesRepository,
    private readonly branchesService: BranchesService,
    private readonly storageService: StorageService,
    private readonly databasesService: DatabasesService,
    private readonly addOnsService: AddOnsService,
  ) {}

  @EmitEvent(AnalysisEvent.CREATED)
  async create(dto: CreateAnalysisDto, files: UploadedLogFiles = {}): Promise<Analysis> {
    const upload = await this.verify(dto, files);
    const file = upload && (await this.store(dto, upload));
    try {
      const { id: branchId } = await this.branchesService.findOrCreateByName(dto.branch);
      return await this.analysesRepository.create(this.toCreateData(dto, branchId, file));
    } catch (error) {
      if (file) await this.storageService.remove([file]).catch(() => undefined);
      throw error;
    }
  }

  /** Creates every analysis or none: all items are verified before any file or row is written */
  @EmitEvent(AnalysisEvent.CREATED, { each: true })
  async createMany({ analyses }: CreateAnalysesDto, uploads: Express.Multer.File[] = []): Promise<Analysis[]> {
    const files = groupBulkLogFiles(uploads, analyses.length);
    const verified = await Promise.all(analyses.map((dto, index) => this.atItem(index, () => this.verify(dto, files[index]))));
    const stored = await this.storeAll(analyses, verified);
    try {
      const branchIds = new Map<string, string>();
      for (const { branch } of analyses)
        if (!branchIds.has(branch)) branchIds.set(branch, (await this.branchesService.findOrCreateByName(branch)).id);
      return await this.analysesRepository.createMany(
        analyses.map((dto, index) => this.toCreateData(dto, branchIds.get(dto.branch)!, stored[index])),
      );
    } catch (error) {
      await this.storageService.remove(stored.filter((file) => file !== undefined)).catch(() => undefined);
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
      branch: { id: branch.id, name: branch.name, slug: branch.slug },
      file: apiData?.file ?? null,
      database: databaseData ? this.databasesService.toSummary(databaseData.database) : null,
    };
  }

  async findByBranch(
    branchIdOrSlug: string,
    { schema, limit, offset, ordering }: ListBranchAnalysesQueryDto,
  ): Promise<Paginated<AnalysisSummary>> {
    const { id: branchId } = await this.branchesService.findOne(branchIdOrSlug);
    const { items, total } = await this.analysesRepository.findPageByBranch(branchId, schema, limit, offset, ordering);
    return { items: items.map((analysis) => this.toSummary(analysis)), total };
  }

  async countByBranch(branchIdOrSlug: string): Promise<AnalysisCountBySchema> {
    const { id: branchId } = await this.branchesService.findOne(branchIdOrSlug);
    const groups = await this.analysesRepository.countBySchema(branchId);
    const counts = Object.fromEntries(Object.values(AnalysisSchema).map((schema) => [schema, 0])) as AnalysisCountBySchema;
    for (const { schema, _count } of groups)
      if (schema in counts) counts[schema as AnalysisSchema] = _count._all;
    return counts;
  }

  async getMetricTrend(branchIdOrSlug: string, schema: AnalysisSchema, limit: number, picks: string[] = []): Promise<MetricTrend> {
    const { id: branchId } = await this.branchesService.findOne(branchIdOrSlug);
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

  /** Returns the log to store, undefined for `DATABASE` */
  private async verify(
    { schema, databaseId, addOn }: CreateAnalysisDto,
    files: UploadedLogFiles,
  ): Promise<Express.Multer.File | undefined> {
    if (schema === AnalysisSchema.DATABASE) {
      await this.databasesService.verify(databaseId!);
      return undefined;
    }
    const upload = files[LOG_FILE_FIELD_BY_SCHEMA[schema]]?.[0];
    if (!upload) throw new BadRequestException({ code: ErrorCode.LOG_FILE_REQUIRED });
    if (addOn) this.addOnsService.verify(addOn, schema);
    return upload;
  }

  private store({ schema, addOn }: CreateAnalysisDto, upload: Express.Multer.File): Promise<StoredFile> {
    return addOn && schema !== AnalysisSchema.DATABASE
      ? this.addOnsService.convert(addOn, schema, upload)
      : this.storageService.save(upload);
  }

  /** Stores every upload, or removes the stored ones and throws the first failure */
  private async storeAll(
    analyses: CreateAnalysisDto[],
    uploads: (Express.Multer.File | undefined)[],
  ): Promise<(StoredFile | undefined)[]> {
    const results = await Promise.allSettled(
      uploads.map((upload, index) => upload && this.atItem(index, () => this.store(analyses[index], upload))),
    );
    const failure = results.find((result) => result.status === 'rejected');
    const stored = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    if (!failure) return stored;
    await this.storageService.remove(stored.filter((file) => file !== undefined)).catch(() => undefined);
    throw failure.reason;
  }

  /** Tags an item failure with its `analyses.<index>` path */
  private async atItem<T>(index: number, task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      if (!(error instanceof HttpException)) throw error;
      const { code } = error.getResponse() as { code: string };
      throw new HttpException({ code, details: { [`analyses.${index}`]: [code] } }, error.getStatus());
    }
  }

  private toCreateData(
    { schema, title, databaseId }: CreateAnalysisDto,
    branchId: string,
    file: StoredFile | undefined,
  ): CreateAnalysisData {
    return schema === AnalysisSchema.DATABASE ? { branchId, schema, title, databaseId } : { branchId, schema, title, file };
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
