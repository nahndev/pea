import { Module } from '@nestjs/common';
import { DatabaseConnectionsModule } from '../database-connections/database-connections.module';
import { LatencyHandler } from './handlers/api/latency.handler';
import { RateHandler } from './handlers/api/rate.handler';
import { RouteErrorRateHandler } from './handlers/api/route-error-rate.handler';
import { RuleHandlerFactory } from './handlers/rule-handler.factory';
import { SlowApiHandler } from './handlers/api/slow-api.handler';
import { SlowRouteHandler } from './handlers/api/slow-route.handler';
import { SlowQueryHandler } from './handlers/database/slow-query.handler';
import { LongRunningQueryHandler } from './handlers/database/long-running-query.handler';
import { LockWaitHandler } from './handlers/database/lock-wait.handler';
import { DeadTupleRateHandler } from './handlers/database/dead-tuple-rate.handler';
import { SeqScanRateHandler } from './handlers/database/seq-scan-rate.handler';
import { UnusedIndexHandler } from './handlers/database/unused-index.handler';
import { LowCacheHitRatioHandler } from './handlers/database/low-cache-hit-ratio.handler';
import { StatementHandler } from './handlers/database/statement.handler';
import { WorkloadHandler } from './handlers/database/workload.handler';
import { QuerySnapshotHandler } from './handlers/database/query-snapshot.handler';
import { StatementEvictionHandler } from './handlers/database/statement-eviction.handler';
import { QueryVariantsHandler } from './handlers/database/query-variants.handler';
import { ReadWriteRatioHandler } from './handlers/database/read-write-ratio.handler';
import { RulesController } from './rules.controller';
import { RulesRepository } from './rules.repository';
import { RulesService } from './rules.service';

@Module({
  imports: [DatabaseConnectionsModule],
  controllers: [RulesController],
  providers: [
    RulesService,
    RulesRepository,
    LatencyHandler,
    RateHandler,
    SlowRouteHandler,
    SlowApiHandler,
    RouteErrorRateHandler,
    SlowQueryHandler,
    LongRunningQueryHandler,
    LockWaitHandler,
    DeadTupleRateHandler,
    SeqScanRateHandler,
    UnusedIndexHandler,
    LowCacheHitRatioHandler,
    StatementHandler,
    WorkloadHandler,
    QuerySnapshotHandler,
    StatementEvictionHandler,
    QueryVariantsHandler,
    ReadWriteRatioHandler,
    RuleHandlerFactory,
  ],
  exports: [RulesService, RuleHandlerFactory],
})
export class RulesModule {}
