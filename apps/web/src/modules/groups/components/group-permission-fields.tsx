'use client';

import type { Permission } from '@tomato/constants';
import { Label, Switch } from '@tomato/ui';
import { PERMISSION_SECTIONS } from '../groups.constants';

interface GroupPermissionFieldsProps {
  value: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

export function GroupPermissionFields({ value, onChange, disabled }: GroupPermissionFieldsProps) {
  const toggle = (permission: Permission, isChecked: boolean) =>
    onChange(isChecked ? [...value, permission] : value.filter((current) => current !== permission));

  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-3 text-sm font-medium">Permissions</legend>
      {PERMISSION_SECTIONS.map(({ title, permissions }) => (
        <div key={title} className="flex flex-col gap-3">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
          {permissions.map(({ value: permission, description }) => (
            <div key={permission} className="flex items-start gap-3">
              <Switch
                id={`permission-${permission}`}
                checked={value.includes(permission)}
                onCheckedChange={(isChecked) => toggle(permission, isChecked)}
                disabled={disabled}
                aria-describedby={`permission-${permission}-hint`}
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor={`permission-${permission}`} className="font-mono text-xs">
                  {permission}
                </Label>
                <p id={`permission-${permission}-hint`} className="text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </fieldset>
  );
}
