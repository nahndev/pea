'use client';

import { Severity } from '@tomato/constants';
import type { RuleView } from '@tomato/types';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { ErrorState } from '@/shared/components/error-state';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useUpdateRule } from '../hooks/use-rules';

interface RuleSeverityFormProps {
  rule: RuleView;
}

export function RuleSeverityForm({ rule }: RuleSeverityFormProps) {
  const { mutate, isPending, isSuccess, error } = useUpdateRule(rule.id);
  const id = `${rule.id}-severity`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">Severity given to every issue this rule creates.</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Severity</Label>
        <div className="flex items-center gap-3">
          <Select value={rule.severity} onValueChange={(severity) => mutate({ severity: severity as Severity })} disabled={isPending}>
            <SelectTrigger id={id} className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Severity).map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {SEVERITY_STYLE[severity].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSuccess && !isPending ? (
            <span role="status" className="text-xs text-muted-foreground">
              Saved
            </span>
          ) : null}
        </div>
      </div>
      {error ? <ErrorState error={error} title="Unable to save severity" /> : null}
    </div>
  );
}
