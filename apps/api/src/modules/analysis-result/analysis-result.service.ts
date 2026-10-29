import { Injectable, Logger } from '@nestjs/common';
import { AnalysisResultStatus } from '@tomato/constants';
import type { IssueView, MetricResultView, Paginated } from '@tomato/types';
import type { AnalysisResult } from '../../generated/client';
import { AnalysesService } from '../analyses/analyses.service';
import type { AnalysisWithContexts } from '../analyses/analyses.types';
import { ListIssuesQueryDto } from '../issues/dto/list-issues-query.dto';
import { IssuesService } from '../issues/issues.service';
import { MetricsService } from '../metrics/metrics.service';
import { QualityGatesService } from '../quality-gates/quality-gates.service';
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
    private readonly qualityGatesService: QualityGatesService,
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

  private async execute(analysis: AnalysisWithContexts, result: AnalysisResult): Promise<AnalysisResult> {
    let issueCount = 0;
    try {
      const rules = await this.rulesService.listAll();
      for (const context of analysis.contexts) {
        for (const rule of rules) {
          if (!this.ruleHandlerFactory.supports(rule.type)) continue;
          const issues = await this.ruleHandlerFactory.create(rule.type).handle(rule, context);
          issueCount += await this.issuesService.createMany(result.id, issues);
        }
      }
      await this.metricsService.measure(result.id, analysis.contexts);
      await this.qualityGatesService.evaluate(result.id);
    } catch (error) {
      await this.analysisResultRepository.finish(result.id, { status: AnalysisResultStatus.FAILED, issueCount });
      throw error;
    }
    return this.analysisResultRepository.finish(result.id, { status: AnalysisResultStatus.COMPLETED, issueCount });
  }
}
