'use client';

import { AGGREGATE_LIMIT_TYPES, type AggregateLimitType, MetricConditionOperator } from '@tomato/constants';
import type { MetricConditionAggregateLimit } from '@tomato/types';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { AGGREGATE_LABEL, VIOLATION_PHRASE } from '@/modules/metrics';

export interface AggregateDraft {
  isEnabled: boolean;
  operator: MetricConditionOperator;
  threshold: string;
}

export type AggregateDrafts = Record<AggregateLimitType, AggregateDraft>;

export const createAggregateDrafts = (limits: MetricConditionAggregateLimit[] = []): AggregateDrafts =>
  Object.fromEntries(
    AGGREGATE_LIMIT_TYPES.map((aggregate) => {
      const limit = limits.find((item) => item.aggregate === aggregate);
      return [
        aggregate,
        { isEnabled: Boolean(limit), operator: limit?.operator ?? MetricConditionOperator.GT, threshold: String(limit?.threshold ?? '') },
      ];
    }),
  ) as AggregateDrafts;

export const toAggregateInputs = (drafts: AggregateDrafts) =>
  AGGREGATE_LIMIT_TYPES.filter((aggregate) => drafts[aggregate].isEnabled).map((aggregate) => ({
    aggregate,
    operator: drafts[aggregate].operator,
    threshold: drafts[aggregate].threshold,
  }));

interface ConditionAggregateFieldsProps {
  drafts: AggregateDrafts;
  onChange: (drafts: AggregateDrafts) => void;
  unitLabel: string | undefined;
  isInvalid?: boolean;
}

export function ConditionAggregateFields({ drafts, onChange, unitLabel, isInvalid = false }: ConditionAggregateFieldsProps) {
  const update = (aggregate: AggregateLimitType, patch: Partial<AggregateDraft>) =>
    onChange({ ...drafts, [aggregate]: { ...drafts[aggregate], ...patch } });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Compared with passed runs</legend>
      <p className="text-xs text-muted-foreground">
        Fails when a result minus the aggregate of the same subject in earlier passed runs of this analysis matches the limit.
      </p>
      {AGGREGATE_LIMIT_TYPES.map((aggregate) => {
        const { isEnabled, operator, threshold } = drafts[aggregate];
        return (
          <div key={aggregate} className="flex flex-wrap items-center gap-3">
            <input
              id={`aggregate-${aggregate}`}
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => update(aggregate, { isEnabled: event.target.checked })}
            />
            <Label htmlFor={`aggregate-${aggregate}`} className="w-28">
              {AGGREGATE_LABEL[aggregate]}
            </Label>
            <Select value={operator} onValueChange={(value) => update(aggregate, { operator: value as MetricConditionOperator })} disabled={!isEnabled}>
              <SelectTrigger className="w-40" aria-label={`${AGGREGATE_LABEL[aggregate]} operator`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MetricConditionOperator).map((value) => (
                  <SelectItem key={value} value={value}>
                    {VIOLATION_PHRASE[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={threshold}
              onChange={(event) => update(aggregate, { threshold: event.target.value })}
              disabled={!isEnabled}
              placeholder={unitLabel}
              aria-label={`${AGGREGATE_LABEL[aggregate]} threshold`}
              aria-invalid={isInvalid && isEnabled}
              className="w-32"
            />
          </div>
        );
      })}
      <p role={isInvalid ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
        {isInvalid ? 'Enter a number of 0 or more for each selected aggregate.' : null}
      </p>
    </fieldset>
  );
}
