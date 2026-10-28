import { Module } from '@nestjs/common';
import { RulesController } from './rules.controller';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

@Module({
  controllers: [RulesController],
  providers: [RulesService, RulesRepository],
  exports: [RulesService],
})
export class RulesModule {}
