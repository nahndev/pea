import { UnprocessableEntityException } from '@nestjs/common';
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
import { RuleHandlerFactory } from './rule-handler.factory';
import { SlowApiHandler } from './api/slow-api.handler';
import { SlowRouteHandler } from './api/slow-route.handler';

describe('RuleHandlerFactory', () => {
  const latencyHandler = {} as LatencyHandler;
  const rateHandler = {} as RateHandler;
  const slowRouteHandler = {} as SlowRouteHandler;
  const routeErrorRateHandler = {} as RouteErrorRateHandler;
  const slowApiHandler = {} as SlowApiHandler;
  const slowQueryHandler = {} as SlowQueryHandler;
  const longRunningQueryHandler = {} as LongRunningQueryHandler;
  const lockWaitHandler = {} as LockWaitHandler;
  const deadTupleRateHandler = {} as DeadTupleRateHandler;
  const seqScanRateHandler = {} as SeqScanRateHandler;
  const unusedIndexHandler = {} as UnusedIndexHandler;
  const lowCacheHitRatioHandler = {} as LowCacheHitRatioHandler;
  const statementHandler = {} as StatementHandler;
  const workloadHandler = {} as WorkloadHandler;
  const querySnapshotHandler = {} as QuerySnapshotHandler;
  const statementEvictionHandler = {} as StatementEvictionHandler;
  const queryVariantsHandler = {} as QueryVariantsHandler;
  const readWriteRatioHandler = {} as ReadWriteRatioHandler;
  const ruleHandlerFactory = new RuleHandlerFactory(
    latencyHandler,
    rateHandler,
    slowRouteHandler,
    routeErrorRateHandler,
    slowApiHandler,
    slowQueryHandler,
    longRunningQueryHandler,
    lockWaitHandler,
    deadTupleRateHandler,
    seqScanRateHandler,
    unusedIndexHandler,
    lowCacheHitRatioHandler,
    statementHandler,
    workloadHandler,
    querySnapshotHandler,
    statementEvictionHandler,
    queryVariantsHandler,
    readWriteRatioHandler,
  );

  it.each([
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
  ])('returns the handler of %s', (type, handler) => {
    expect(ruleHandlerFactory.create(type)).toBe(handler);
  });

  it('supports every rule type', () => {
    for (const type of Object.values(RuleType)) expect(ruleHandlerFactory.supports(type)).toBe(true);
  });

  it('throws RULE_TYPE_UNSUPPORTED when no handler exists', () => {
    expect.assertions(1);
    try {
      ruleHandlerFactory.create('UNKNOWN');
    } catch (error) {
      expect((error as UnprocessableEntityException).getResponse()).toEqual({
        code: ErrorCode.RULE_TYPE_UNSUPPORTED,
      });
    }
  });
});
