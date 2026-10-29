import { Injectable, Logger } from '@nestjs/common';
import { type AnalysisSchema, AnalysisResultStatus } from '@tomato/constants';
import type { IssueView, MetricResultView, Paginated } from '@tomato/types';
import type { Analysis, AnalysisResult } from '../../generated/client';
import { AnalysesService } from '../analyses/analyses.service';
import { MetricConditionsService } from '../conditions/metric-conditions.service';
import { ListIssuesQueryDto } from '../issues/dto/list-issues-query.dto';
import { IssuesService } from '../issues/issues.service';
import { MetricsService } from '../metrics/metrics.service';
import { RuleHandlerFactory } from '../rules/handlers/rule-handler.factory';
import { RulesService } from '../rules/rules.service';
import { AnalysisResultRepository } from './analysis-result.repository';
import { RunAnalysisDto } from './dto/run-analysis.dto';

@Injectable()
export class AnalysisResultService {
  private readonly logger = new Logger(AnalysisResultService.name);

  constructor(
    private readonly analysisResultRepository: AnalysisResultRepository,
    private readonly analysesService: AnalysesService,
    private readonly rulesService: RulesService,
    private readonly issuesService: IssuesService,
    private readonly ruleHandlerFactory: RuleHandlerFactory,
    private readonly metricsService: MetricsService,
    private readonly metricConditionsService: MetricConditionsService,
  ) {}

  async run({ analysisId }: RunAnalysisDto): Promise<AnalysisResult> {
    const analysis = await this.analysesService.findOne(analysisId);
    const result = await this.analysisResultRepository.create(analysis.id);
    return this.execute(analysis, result);
  }

  async rerun(analysisId: string): Promise<AnalysisResult> {
    const analysis = await this.analysesService.findOne(analysisId);
    const result = await this.analysisResultRepository.create(analysis.id);
    this.execute(analysis, result).catch((error: unknown) =>
      this.logger.error(`Re-analysis ${result.id} failed`, error instanceof Error ? error.stack : String(error)),
    );
    return result;
  }

  async listIssues(analysisId: string, query: ListIssuesQueryDto): Promise<Paginated<IssueView>> {
    const result = await this.findLatest(analysisId);
    if (!result) return { items: [], total: 0 };
    return this.issuesService.findPage(result.id, query);
  }

  async listMetrics(analysisId: string): Promise<MetricResultView[]> {
    const result = await this.findLatest(analysisId);
    if (!result) return [];
    return this.metricsService.findResultViews(result.id);
  }

  private async findLatest(analysisId: string): Promise<AnalysisResult | null> {
    await this.analysesService.findOne(analysisId);
    return this.analysisResultRepository.findLatestByAnalysis(analysisId);
  }

  private async execute(analysis: Analysis, result: AnalysisResult): Promise<AnalysisResult> {
    const schema = analysis.schema as AnalysisSchema;
    let issueCount = 0;
    try {
      const rules = await this.rulesService.listBySchema(schema);
      for (const rule of rules) {
        if (!this.ruleHandlerFactory.supports(rule.type)) continue;
        const issues = await this.ruleHandlerFactory.create(rule.type).handle(rule, analysis);
        issueCount += await this.issuesService.createMany(
          result.id,
          issues.map((issue) => ({ ...issue, severity: rule.severity })),
        );
      }
      await this.metricsService.measure(result.id, analysis);
      await this.metricConditionsService.evaluate(result.id, schema);
    } catch (error) {
      await this.analysisResultRepository.finish(result.id, { status: AnalysisResultStatus.FAILED, issueCount });
      throw error;
    }
    return this.analysisResultRepository.finish(result.id, { status: AnalysisResultStatus.COMPLETED, issueCount });
  }
}
