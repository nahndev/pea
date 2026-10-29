'use client';

import type { SubjectView } from '@tomato/types';
import { Label } from '@tomato/ui';

interface MetricSubjectFilterProps {
  id: string;
  label: string;
  hint: string;
  subjects: SubjectView[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MetricSubjectFilter({ id, label, hint, subjects, selected, onChange }: MetricSubjectFilterProps) {
  const toggle = (uuid: string) =>
    onChange(selected.includes(uuid) ? selected.filter((item) => item !== uuid) : [...selected, uuid]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <ul className="flex max-h-48 flex-col gap-1 overflow-auto rounded-md border p-2">
        {subjects.map(({ uuid, description }) => (
          <li key={uuid} className="flex items-center gap-2">
            <input id={`${id}-${uuid}`} type="checkbox" checked={selected.includes(uuid)} onChange={() => toggle(uuid)} />
            <Label htmlFor={`${id}-${uuid}`} className="break-all font-mono text-xs font-normal">
              {description}
            </Label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
