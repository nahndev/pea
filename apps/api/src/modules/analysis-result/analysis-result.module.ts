import { Module } from '@nestjs/common';
import { AnalysesModule } from '../analyses/analyses.module';
import { IssuesModule } from '../issues/issues.module';
import { RulesModule } from '../rules/rules.module';
import { AnalysisResultController } from './analysis-result.controller';
import { AnalysisResultListener } from './analysis-result.listener';
import { AnalysisResultRepository } from './analysis-result.repository';
import { AnalysisResultService } from './analysis-result.service';
import { LatestAnalysisResultController } from './latest-analysis-result.controller';

@Module({
  imports: [AnalysesModule, RulesModule, IssuesModule],
  controllers: [AnalysisResultController, LatestAnalysisResultController],
  providers: [AnalysisResultService, AnalysisResultRepository, AnalysisResultListener],
})
export class AnalysisResultModule {}
