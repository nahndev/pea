import { Module } from '@nestjs/common';
import { AnalysesModule } from '../analyses/analyses.module';
import { ConditionsModule } from '../conditions/conditions.module';
import { IssuesModule } from '../issues/issues.module';
import { MetricsModule } from '../metrics/metrics.module';
import { RulesModule } from '../rules/rules.module';
import { AnalysisResultController } from './analysis-result.controller';
import { AnalysisResultListener } from './analysis-result.listener';
import { AnalysisResultRepository } from './analysis-result.repository';
import { AnalysisResultService } from './analysis-result.service';

@Module({
  imports: [AnalysesModule, RulesModule, IssuesModule, MetricsModule, ConditionsModule],
  controllers: [AnalysisResultController],
  providers: [AnalysisResultService, AnalysisResultRepository, AnalysisResultListener],
})
export class AnalysisResultModule {}
