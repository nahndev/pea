'use client';

import { Button, Input, Label } from '@tomato/ui';
import type { RuleView } from '@tomato/types';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useUpdateRule } from '../../hooks/use-rules';
import { RULE_CONFIG_FIELDS, type RuleConfigField } from '../../rules.constants';
import { buildRuleConfigSchema } from '../../rules.schemas';

interface RuleConfigFormProps {
  rule: RuleView;
  fields: readonly RuleConfigField[];
  hint: string;
}

export function RuleConfigForm({ rule, fields: declaredFields, hint }: RuleConfigFormProps) {
  const { mutate, isPending, error: requestError } = useUpdateRule(rule.id);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const fields = declaredFields.filter((field) => field in rule.config);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = buildRuleConfigSchema(fields).safeParse(form);
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map(({ path }) => [String(path[0]), 'Enter a valid value.'])));
      return;
    }
    setFieldErrors({});
    mutate(parsed.data, { onSuccess: () => setIsSaved(true) });
  };

  return (
    <form
      onSubmit={submit}
      onChange={() => setIsSaved(false)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card"
    >
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap items-start gap-4">
        {fields.map((field) => {
          const { label, unit, step } = RULE_CONFIG_FIELDS[field];
          const id = `${rule.id}-${field}`;
          return (
            <div key={field} className="flex flex-col gap-2">
              <Label htmlFor={id}>{unit ? `${label} (${unit})` : label}</Label>
              <Input
                id={id}
                name={field}
                type="number"
                inputMode="decimal"
                step={step}
                defaultValue={rule.config[field]}
                className="w-40"
                aria-invalid={Boolean(fieldErrors[field])}
                aria-describedby={`${id}-error`}
              />
              <p id={`${id}-error`} role={fieldErrors[field] ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
                {fieldErrors[field]}
              </p>
            </div>
          );
        })}
      </div>
      {requestError ? <ErrorState error={requestError} title="Unable to save rule" /> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending || fields.length === 0}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        {isSaved ? (
          <span role="status" className="text-xs text-muted-foreground">
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
