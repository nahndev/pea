import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalysisResultStatus, ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import type { AnalysisResult } from '../../generated/client';
import { AnalysesService } from '../analyses/analyses.service';
import { IssuesService } from '../issues/issues.service';
import { MetricsService } from '../metrics/metrics.service';
import { QualityGatesService } from '../quality-gates/quality-gates.service';
import { RuleHandlerFactory } from '../rules/handlers/rule-handler.factory';
import { RulesService } from '../rules/rules.service';
import { AnalysisResultRepository } from './analysis-result.repository';
import { ListAnalysisResultsQueryDto } from './dto/list-analysis-results-query.dto';
import { RunAnalysisDto } from './dto/run-analysis.dto';

@Injectable()
export class AnalysisResultService {
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
    const rules = await this.rulesService.listAll();
    const result = await this.analysisResultRepository.create(analysis.id);

    let issueCount = 0;
    try {
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

  findAll({ analysisId, limit, offset }: ListAnalysisResultsQueryDto): Promise<Paginated<AnalysisResult>> {
    return this.analysisResultRepository.findMany(analysisId, limit, offset);
  }

  async findOne(id: string): Promise<AnalysisResult> {
    const result = await this.analysisResultRepository.findById(id);
    if (!result) throw new NotFoundException({ code: ErrorCode.ANALYSIS_RESULT_NOT_FOUND });
    return result;
  }

  async findLatest(analysisId: string): Promise<AnalysisResult> {
    const result = await this.analysisResultRepository.findLatest(analysisId);
    if (!result) throw new NotFoundException({ code: ErrorCode.ANALYSIS_RESULT_NOT_FOUND });
    return result;
  }
}
