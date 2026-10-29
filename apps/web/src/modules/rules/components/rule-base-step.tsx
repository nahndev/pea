'use client';

import type { RuleView } from '@tomato/types';
import { Button } from '@tomato/ui';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useRules } from '../hooks/use-rules';

interface RuleBaseStepProps {
  baseId: string | undefined;
  onSelect: (rule: RuleView) => void;
  onNext: () => void;
}

export function RuleBaseStep({ baseId, onSelect, onNext }: RuleBaseStepProps) {
  const { data, error, isPending } = useRules();

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-muted-foreground">
          The new rule behaves like the rule you pick. You can change its title, severity and settings next.
        </legend>
        {isPending ? <TableSkeleton rows={4} /> : null}
        {error ? <ErrorState error={error} /> : null}
        {data?.length === 0 ? <EmptyState title="No rule to base on yet" /> : null}
        {data?.map((rule) => (
          <label
            key={rule.id}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 has-checked:border-primary has-checked:bg-muted focus-within:ring-2 focus-within:ring-ring"
          >
            <span className="flex items-center gap-3">
              <input type="radio" name="base-rule" value={rule.id} checked={rule.id === baseId} onChange={() => onSelect(rule)} />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{rule.description}</span>
                <span className="text-xs text-muted-foreground">{rule.type}</span>
              </span>
            </span>
            <StatusBadge style={SEVERITY_STYLE[rule.severity]} />
          </label>
        ))}
      </fieldset>
      <div>
        <Button type="button" size="sm" onClick={onNext} disabled={!baseId}>
          Next
        </Button>
      </div>
    </div>
  );
}
