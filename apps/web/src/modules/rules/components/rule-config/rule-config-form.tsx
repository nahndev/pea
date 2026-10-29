'use client';

import { Button } from '@tomato/ui';
import type { RuleView } from '@tomato/types';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useUpdateRule } from '../../hooks/use-rules';
import type { RuleConfigField } from '../../rules.constants';
import { buildRuleConfigSchema } from '../../rules.schemas';
import { RuleConfigInputs } from './rule-config-inputs';

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
      <RuleConfigInputs idPrefix={rule.id} fields={fields} defaults={rule.config} errors={fieldErrors} />
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
