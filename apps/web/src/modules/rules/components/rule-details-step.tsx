'use client';

import { Severity } from '@tomato/constants';
import type { RuleView } from '@tomato/types';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useCreateRule } from '../hooks/use-rules';
import { isRuleConfigField } from '../rules.constants';
import { buildRuleConfigSchema, ruleDescriptionSchema } from '../rules.schemas';
import { RuleConfigInputs } from './rule-config/rule-config-inputs';

const FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
};

interface RuleDetailsStepProps {
  base: RuleView;
  onBack: () => void;
}

export function RuleDetailsStep({ base, onBack }: RuleDetailsStepProps) {
  const router = useRouter();
  const { mutate, isPending, error: requestError } = useCreateRule();
  const [severity, setSeverity] = useState<Severity>(base.severity);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fields = Object.keys(base.config).filter(isRuleConfigField);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const description = ruleDescriptionSchema.safeParse(form.description);
    const config = buildRuleConfigSchema(fields).safeParse(form);

    const errors: Record<string, string> = {};
    if (!description.success) errors.description = FIELD_ERRORS[description.error.issues[0]?.message ?? ''] ?? FIELD_ERRORS.required;
    if (!config.success) for (const { path } of config.error.issues) errors[String(path[0])] = 'Enter a valid value.';
    setFieldErrors(errors);
    if (!description.success || !config.success) return;

    mutate({ schema: base.schema, type: base.type, description: description.data, severity, config: config.data }, { onSuccess: ({ id }) => router.push(`/rules/${id}`) });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">
        Based on <span className="font-medium text-foreground">{base.description}</span> ({base.type}). The new rule is independent of it.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Title</Label>
        <Input
          id="description"
          name="description"
          defaultValue={`${base.description} (copy)`}
          maxLength={255}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby="description-error"
          required
        />
        <p id="description-error" role={fieldErrors.description ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
          {fieldErrors.description}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="severity">Severity</Label>
        <Select value={severity} onValueChange={(value) => setSeverity(value as Severity)}>
          <SelectTrigger id="severity" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Severity).map((value) => (
              <SelectItem key={value} value={value}>
                {SEVERITY_STYLE[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <RuleConfigInputs idPrefix="new-rule" fields={fields} defaults={base.config} errors={fieldErrors} />
      {requestError ? <ErrorState error={requestError} title="Unable to create rule" /> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create rule'}
        </Button>
        <Button type="button" variant="ghost" intent="neutral" onClick={onBack} disabled={isPending}>
          Back
        </Button>
      </div>
    </form>
  );
}
