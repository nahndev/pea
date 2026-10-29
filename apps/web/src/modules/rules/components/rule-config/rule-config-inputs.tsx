import { Input, Label } from '@tomato/ui';
import { RULE_CONFIG_FIELDS, type RuleConfigField } from '../../rules.constants';

interface RuleConfigInputsProps {
  idPrefix: string;
  fields: readonly RuleConfigField[];
  defaults: Record<string, number>;
  errors: Record<string, string>;
}

export function RuleConfigInputs({ idPrefix, fields, defaults, errors }: RuleConfigInputsProps) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {fields.map((field) => {
        const { label, unit, step } = RULE_CONFIG_FIELDS[field];
        const id = `${idPrefix}-${field}`;
        return (
          <div key={field} className="flex flex-col gap-2">
            <Label htmlFor={id}>{unit ? `${label} (${unit})` : label}</Label>
            <Input
              id={id}
              name={field}
              type="number"
              inputMode="decimal"
              step={step}
              defaultValue={defaults[field]}
              className="w-40"
              aria-invalid={Boolean(errors[field])}
              aria-describedby={`${id}-error`}
            />
            <p id={`${id}-error`} role={errors[field] ? 'alert' : undefined} className="text-xs text-danger empty:hidden">
              {errors[field]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
