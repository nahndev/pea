'use client';

import type { AnalysisSchema } from '@tomato/constants';
import { Label, Switch } from '@tomato/ui';
import { useAddOns } from '../hooks/use-add-ons';

interface AddOnSwitchesProps {
  schema: AnalysisSchema;
  /** Id of the active add-on */
  value?: string;
  onChange: (addOnId?: string) => void;
  disabled?: boolean;
}

/** One switch per add-on converting logs of `schema`; at most one is on */
export function AddOnSwitches({ schema, value, onChange, disabled }: AddOnSwitchesProps) {
  const { data } = useAddOns();
  const addOns = (data ?? []).flatMap((addOn) => {
    const converter = addOn.converters.find(({ schemas }) => schemas.includes(schema));
    return converter ? [{ ...addOn, converter }] : [];
  });

  return addOns.map(({ id, label, description, converter }) => (
    <div key={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Switch
          id={`add-on-${id}`}
          checked={value === id}
          onCheckedChange={(isChecked) => onChange(isChecked ? id : undefined)}
          disabled={disabled}
          aria-describedby={`add-on-${id}-hint`}
        />
        <Label htmlFor={`add-on-${id}`}>{label} add-on</Label>
      </div>
      <p id={`add-on-${id}-hint`} className="text-xs text-muted-foreground">
        {description} Upload a {converter.input}: {converter.hint}
      </p>
    </div>
  ));
}
