import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { P90Handler } from './handlers/p90.handler';
import { RuleHandlerFactory } from './handlers/rule-handler.factory';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

@Module({
  imports: [FilesModule],
  providers: [RulesService, RulesRepository, P90Handler, RuleHandlerFactory],
  exports: [RulesService, RuleHandlerFactory],
})
export class RulesModule {}
