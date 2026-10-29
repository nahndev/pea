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
};

export function createRuleConfig(rule: RuleView): ReactElement | null {
  const RuleTypeConfig = RULE_CONFIG_BY_TYPE[rule.type];
  return RuleTypeConfig ? <RuleTypeConfig rule={rule} /> : null;
}
