import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { LatencyHandler } from './api/latency.handler';
import { RateHandler } from './api/rate.handler';
import { RouteErrorRateHandler } from './api/route-error-rate.handler';
import { SlowQueryHandler } from './database/slow-query.handler';
import { LongRunningQueryHandler } from './database/long-running-query.handler';
import { LockWaitHandler } from './database/lock-wait.handler';
import { DeadTupleRateHandler } from './database/dead-tuple-rate.handler';
import { SeqScanRateHandler } from './database/seq-scan-rate.handler';
import { UnusedIndexHandler } from './database/unused-index.handler';
import { LowCacheHitRatioHandler } from './database/low-cache-hit-ratio.handler';
import { StatementHandler } from './database/statement.handler';
import { WorkloadHandler } from './database/workload.handler';
import { QuerySnapshotHandler } from './database/query-snapshot.handler';
import { StatementEvictionHandler } from './database/statement-eviction.handler';
import { QueryVariantsHandler } from './database/query-variants.handler';
import { ReadWriteRatioHandler } from './database/read-write-ratio.handler';
import type { RuleHandler } from './rule-handler.types';
import { SlowApiHandler } from './api/slow-api.handler';
import { SlowRouteHandler } from './api/slow-route.handler';
import { ErrorGroupHandler } from './bug/error-group.handler';
import { ErrorEndpointHandler } from './bug/error-endpoint.handler';

@Injectable()
export class RuleHandlerFactory {
  private readonly handlers: ReadonlyMap<string, RuleHandler>;

  constructor(
    latencyHandler: LatencyHandler,
    rateHandler: RateHandler,
    slowRouteHandler: SlowRouteHandler,
    routeErrorRateHandler: RouteErrorRateHandler,
    slowApiHandler: SlowApiHandler,
    slowQueryHandler: SlowQueryHandler,
    longRunningQueryHandler: LongRunningQueryHandler,
    lockWaitHandler: LockWaitHandler,
    deadTupleRateHandler: DeadTupleRateHandler,
    seqScanRateHandler: SeqScanRateHandler,
    unusedIndexHandler: UnusedIndexHandler,
    lowCacheHitRatioHandler: LowCacheHitRatioHandler,
    statementHandler: StatementHandler,
    workloadHandler: WorkloadHandler,
    querySnapshotHandler: QuerySnapshotHandler,
    statementEvictionHandler: StatementEvictionHandler,
    queryVariantsHandler: QueryVariantsHandler,
    readWriteRatioHandler: ReadWriteRatioHandler,
    errorGroupHandler: ErrorGroupHandler,
    errorEndpointHandler: ErrorEndpointHandler,
  ) {
    this.handlers = new Map<string, RuleHandler>([
      [RuleType.P50_FAILURE, latencyHandler],
      [RuleType.P90_FAILURE, latencyHandler],
      [RuleType.P95_FAILURE, latencyHandler],
      [RuleType.P99_FAILURE, latencyHandler],
      [RuleType.AVG_LATENCY, latencyHandler],
      [RuleType.MAX_LATENCY, latencyHandler],
      [RuleType.SLOW_REQUEST_RATE, rateHandler],
      [RuleType.ERROR_RATE, rateHandler],
      [RuleType.CLIENT_ERROR_RATE, rateHandler],
      [RuleType.SLOW_ROUTE, slowRouteHandler],
      [RuleType.SLOW_API, slowApiHandler],
      [RuleType.ROUTE_ERROR_RATE, routeErrorRateHandler],
      [RuleType.SLOW_QUERY, slowQueryHandler],
      [RuleType.LONG_RUNNING_QUERY, longRunningQueryHandler],
      [RuleType.LOCK_WAIT, lockWaitHandler],
      [RuleType.DEAD_TUPLE_RATE, deadTupleRateHandler],
      [RuleType.SEQ_SCAN_RATE, seqScanRateHandler],
      [RuleType.UNUSED_INDEX, unusedIndexHandler],
      [RuleType.LOW_CACHE_HIT_RATIO, lowCacheHitRatioHandler],
      [RuleType.HIGH_TOTAL_TIME_QUERY, statementHandler],
      [RuleType.MAX_TIME_SPIKE_QUERY, statementHandler],
      [RuleType.UNSTABLE_QUERY, statementHandler],
      [RuleType.FREQUENT_QUERY, statementHandler],
      [RuleType.N_PLUS_ONE_QUERY, statementHandler],
      [RuleType.LARGE_RESULT_QUERY, statementHandler],
      [RuleType.UNLIMITED_SELECT_QUERY, statementHandler],
      [RuleType.SELECT_STAR_QUERY, statementHandler],
      [RuleType.MISSING_INDEX_QUERY, statementHandler],
      [RuleType.DISK_READ_QUERY, statementHandler],
      [RuleType.LOW_CACHE_HIT_QUERY, statementHandler],
      [RuleType.DIRTIED_BUFFERS_QUERY, statementHandler],
      [RuleType.WRITTEN_BUFFERS_QUERY, statementHandler],
      [RuleType.TEMP_FILE_QUERY, statementHandler],
      [RuleType.LOCAL_BUFFER_QUERY, statementHandler],
      [RuleType.HIGH_WAL_QUERY, statementHandler],
      [RuleType.HIGH_IO_TIME_QUERY, statementHandler],
      [RuleType.SLOW_PLANNING_QUERY, statementHandler],
      [RuleType.PLAN_OVER_EXEC_QUERY, statementHandler],
      [RuleType.HIGH_JIT_QUERY, statementHandler],
      [RuleType.OFFSET_PAGINATION_QUERY, statementHandler],
      [RuleType.LIKE_QUERY, statementHandler],
      [RuleType.FUNCTION_IN_WHERE_QUERY, statementHandler],
      [RuleType.ORDER_BY_RANDOM_QUERY, statementHandler],
      [RuleType.LONG_IN_LIST_QUERY, statementHandler],
      [RuleType.FREQUENT_COUNT_QUERY, statementHandler],
      [RuleType.UNFILTERED_WRITE_QUERY, statementHandler],
      [RuleType.MASS_WRITE_QUERY, statementHandler],
      [RuleType.ROW_BY_ROW_INSERT_QUERY, statementHandler],
      [RuleType.CPU_INTENSIVE_QUERY, statementHandler],
      [RuleType.IO_INTENSIVE_QUERY, statementHandler],
      [RuleType.DATABASE_WORKLOAD, workloadHandler],
      [RuleType.ROLE_WORKLOAD, workloadHandler],
      [RuleType.CHANGED_QUERY, querySnapshotHandler],
      [RuleType.REGRESSED_QUERY, querySnapshotHandler],
      [RuleType.EXPENSIVE_UTILITY_COMMAND, statementHandler],
      [RuleType.NESTED_QUERY, statementHandler],
      [RuleType.STATEMENT_EVICTION, statementEvictionHandler],
      [RuleType.QUERY_VARIANTS, queryVariantsHandler],
      [RuleType.TIME_SHARE_QUERY, statementHandler],
      [RuleType.READ_WRITE_RATIO, readWriteRatioHandler],
      [RuleType.CRITICAL_ERROR, errorGroupHandler],
      [RuleType.FREQUENT_ERROR, errorGroupHandler],
      [RuleType.ERROR_ENDPOINT, errorEndpointHandler],
    ]);
  }

  supports(type: string): boolean {
    return this.handlers.has(type);
  }

  create(type: string): RuleHandler {
    const handler = this.handlers.get(type);
    if (!handler) throw new UnprocessableEntityException({ code: ErrorCode.RULE_TYPE_UNSUPPORTED });
    return handler;
  }
}
