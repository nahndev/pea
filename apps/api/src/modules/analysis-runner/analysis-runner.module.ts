import { Module } from '@nestjs/common';
import { AnalysesModule } from '../analyses/analyses.module';
import { IssuesModule } from '../issues/issues.module';
import { RulesModule } from '../rules/rules.module';
import { AnalysisRunnerController } from './analysis-runner.controller';
import { AnalysisRunnerRepository } from './analysis-runner.repository';
import { AnalysisRunnerService } from './analysis-runner.service';

@Module({
  imports: [AnalysesModule, RulesModule, IssuesModule],
  controllers: [AnalysisRunnerController],
  providers: [AnalysisRunnerService, AnalysisRunnerRepository],
})
export class AnalysisRunnerModule {}
