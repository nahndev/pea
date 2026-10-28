import { Module } from '@nestjs/common';
import { AnalysisContextsModule } from '../analysis-contexts/analysis-contexts.module';
import { FilesModule } from '../files/files.module';
import { P90Handler } from './handlers/p90.handler';
import { RuleHandlerFactory } from './handlers/rule-handler.factory';
import { RulesController } from './rules.controller';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

@Module({
  imports: [AnalysisContextsModule, FilesModule],
  controllers: [RulesController],
  providers: [RulesService, RulesRepository, P90Handler, RuleHandlerFactory],
  exports: [RulesService, RuleHandlerFactory],
})
export class RulesModule {}
