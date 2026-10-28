import { Module } from '@nestjs/common';
import { AnalysesModule } from '../analyses/analyses.module';
import { IssuesModule } from '../issues/issues.module';
import { MetricsModule } from '../metrics/metrics.module';
import { QualityGatesModule } from '../quality-gates/quality-gates.module';
import { RulesModule } from '../rules/rules.module';
import { AnalysisResultListener } from './analysis-result.listener';
import { AnalysisResultRepository } from './analysis-result.repository';
import { AnalysisResultService } from './analysis-result.service';

@Module({
  imports: [AnalysesModule, RulesModule, IssuesModule, MetricsModule, QualityGatesModule],
  providers: [AnalysisResultService, AnalysisResultRepository, AnalysisResultListener],
})
export class AnalysisResultModule {}
