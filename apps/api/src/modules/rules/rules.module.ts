import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { LatencyHandler } from './handlers/api/latency.handler';
import { RateHandler } from './handlers/api/rate.handler';
import { RouteErrorRateHandler } from './handlers/api/route-error-rate.handler';
import { RuleHandlerFactory } from './handlers/rule-handler.factory';
import { SlowApiHandler } from './handlers/api/slow-api.handler';
import { SlowRouteHandler } from './handlers/api/slow-route.handler';
import { RulesController } from './rules.controller';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

@Module({
  imports: [FilesModule],
  controllers: [RulesController],
  providers: [
    RulesService,
    RulesRepository,
    LatencyHandler,
    RateHandler,
    SlowRouteHandler,
    SlowApiHandler,
    RouteErrorRateHandler,
    RuleHandlerFactory,
  ],
  exports: [RulesService, RuleHandlerFactory],
})
export class RulesModule {}
