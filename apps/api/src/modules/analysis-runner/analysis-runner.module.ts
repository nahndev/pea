import { Module } from '@nestjs/common';
import { AnalysesModule } from '../analyses/analyses.module';
import { IssuesModule } from '../issues/issues.module';
import { RulesModule } from '../rules/rules.module';
import { AnalysisRunnerController } from './analysis-runner.controller';
import { AnalysisRunnerListener } from './analysis-runner.listener';
import { AnalysisRunnerRepository } from './analysis-runner.repository';
import { AnalysisRunnerService } from './analysis-runner.service';
import { LatestAnalysisResultController } from './latest-analysis-result.controller';

@Module({
  imports: [AnalysesModule, RulesModule, IssuesModule],
  controllers: [AnalysisRunnerController, LatestAnalysisResultController],
  providers: [AnalysisRunnerService, AnalysisRunnerRepository, AnalysisRunnerListener],
})
export class AnalysisRunnerModule {}
