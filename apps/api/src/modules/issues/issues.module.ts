import { Module } from '@nestjs/common';
import { AnalysisContextsModule } from '../analysis-contexts/analysis-contexts.module';
import { RulesModule } from '../rules/rules.module';
import { IssuesController } from './issues.controller';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

@Module({
  imports: [RulesModule, AnalysisContextsModule],
  controllers: [IssuesController],
  providers: [IssuesService, IssuesRepository],
  exports: [IssuesService],
})
export class IssuesModule {}
