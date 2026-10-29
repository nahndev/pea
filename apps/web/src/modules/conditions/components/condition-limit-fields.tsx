'use client';

import { MetricConditionOperator } from '@tomato/constants';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { VIOLATION_PHRASE } from '@/modules/metrics';

interface ConditionLimitFieldsProps {
  operator: MetricConditionOperator;
  onOperatorChange: (operator: MetricConditionOperator) => void;
  unitLabel: string | undefined;
  defaultThreshold?: number;
  error?: string;
}

export function ConditionLimitFields({ operator, onOperatorChange, unitLabel, defaultThreshold, error }: ConditionLimitFieldsProps) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="operator">Fails when the value is</Label>
        <Select value={operator} onValueChange={(value) => onOperatorChange(value as MetricConditionOperator)}>
          <SelectTrigger id="operator" className="w-44">
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
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="threshold">{unitLabel ? `Threshold (${unitLabel})` : 'Threshold'}</Label>
        <Input
          id="threshold"
          name="threshold"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          defaultValue={defaultThreshold}
          className="w-40"
          aria-invalid={Boolean(error)}
          aria-describedby="threshold-error"
        />
        <p id="threshold-error" role={error ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
          {error}
        </p>
      </div>
    </div>
  );
}
