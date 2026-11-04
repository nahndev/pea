import { RuleType } from '@tomato/constants';
import type { RuleView } from '@tomato/types';
import type { ComponentType, ReactElement } from 'react';
import type { RuleConfigProps } from '../../rules.types';
import { ErrorRateRuleConfig } from './error-rate-rule-config';
import { LatencyRuleConfig } from './latency-rule-config';
import { RouteErrorRateRuleConfig } from './route-error-rate-rule-config';
import { SlowApiRuleConfig } from './slow-api-rule-config';
import { SlowRequestRateRuleConfig } from './slow-request-rate-rule-config';
import { SlowRouteRuleConfig } from './slow-route-rule-config';
import { SlowQueryRuleConfig } from './slow-query-rule-config';
import { LongRunningQueryRuleConfig } from './long-running-query-rule-config';
import { LockWaitRuleConfig } from './lock-wait-rule-config';
import { DeadTupleRateRuleConfig } from './dead-tuple-rate-rule-config';
import { SeqScanRateRuleConfig } from './seq-scan-rate-rule-config';
import { UnusedIndexRuleConfig } from './unused-index-rule-config';
import { LowCacheHitRatioRuleConfig } from './low-cache-hit-ratio-rule-config';
import { PgStatStatementsRuleConfig } from './pg-stat-statements-rule-config';
import { CriticalErrorRuleConfig } from './critical-error-rule-config';
import { FrequentErrorRuleConfig } from './frequent-error-rule-config';
import { ErrorEndpointRuleConfig } from './error-endpoint-rule-config';
import { PG_STAT_STATEMENTS_RULE_CONFIG } from '../../rules.constants';

const RULE_CONFIG_BY_TYPE: Partial<Record<RuleType, ComponentType<RuleConfigProps>>> = {
  [RuleType.P50_FAILURE]: LatencyRuleConfig,
  [RuleType.P90_FAILURE]: LatencyRuleConfig,
  [RuleType.P95_FAILURE]: LatencyRuleConfig,
  [RuleType.P99_FAILURE]: LatencyRuleConfig,
  [RuleType.AVG_LATENCY]: LatencyRuleConfig,
  [RuleType.MAX_LATENCY]: LatencyRuleConfig,
  [RuleType.SLOW_REQUEST_RATE]: SlowRequestRateRuleConfig,
  [RuleType.ERROR_RATE]: ErrorRateRuleConfig,
  [RuleType.CLIENT_ERROR_RATE]: ErrorRateRuleConfig,
  [RuleType.SLOW_ROUTE]: SlowRouteRuleConfig,
  [RuleType.ROUTE_ERROR_RATE]: RouteErrorRateRuleConfig,
  [RuleType.SLOW_API]: SlowApiRuleConfig,
  [RuleType.SLOW_QUERY]: SlowQueryRuleConfig,
  [RuleType.LONG_RUNNING_QUERY]: LongRunningQueryRuleConfig,
  [RuleType.LOCK_WAIT]: LockWaitRuleConfig,
  [RuleType.DEAD_TUPLE_RATE]: DeadTupleRateRuleConfig,
  [RuleType.SEQ_SCAN_RATE]: SeqScanRateRuleConfig,
  [RuleType.UNUSED_INDEX]: UnusedIndexRuleConfig,
  [RuleType.LOW_CACHE_HIT_RATIO]: LowCacheHitRatioRuleConfig,
  [RuleType.CRITICAL_ERROR]: CriticalErrorRuleConfig,
  [RuleType.FREQUENT_ERROR]: FrequentErrorRuleConfig,
  [RuleType.ERROR_ENDPOINT]: ErrorEndpointRuleConfig,
  ...Object.fromEntries(Object.keys(PG_STAT_STATEMENTS_RULE_CONFIG).map((type) => [type, PgStatStatementsRuleConfig])),
};

export function createRuleConfig(rule: RuleView): ReactElement | null {
  const RuleTypeConfig = RULE_CONFIG_BY_TYPE[rule.type];
  return RuleTypeConfig ? <RuleTypeConfig rule={rule} /> : null;
}
