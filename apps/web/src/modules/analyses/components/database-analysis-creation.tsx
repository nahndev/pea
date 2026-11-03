'use client';

import { Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '@tomato/ui';
import type { ComponentProps } from 'react';
import { DEFAULT_DATABASE_PORT, DatabaseConnectionMode } from '../analyses.constants';
import { FieldError } from './field-error';

interface DatabaseAnalysisCreationProps {
  mode: DatabaseConnectionMode;
  onModeChange: (mode: DatabaseConnectionMode) => void;
  fieldErrors: Record<string, string>;
}

export function DatabaseAnalysisCreation({ mode, onModeChange, fieldErrors }: DatabaseAnalysisCreationProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">PostgreSQL connection</legend>
      <Tabs value={mode} onValueChange={(value) => onModeChange(value as DatabaseConnectionMode)}>
        <TabsList aria-label="Connection type">
          <TabsTrigger value={DatabaseConnectionMode.FIELDS}>Fields</TabsTrigger>
          <TabsTrigger value={DatabaseConnectionMode.URL}>Connection string</TabsTrigger>
        </TabsList>
        <TabsContent value={DatabaseConnectionMode.FIELDS} className="flex flex-col gap-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <ConnectionField name="host" label="Host" error={fieldErrors.host} placeholder="localhost" autoComplete="off" maxLength={255} />
            <ConnectionField name="port" label="Port" error={fieldErrors.port} type="number" inputMode="numeric" min={1} max={65535} step={1} placeholder={String(DEFAULT_DATABASE_PORT)} />
          </div>
          <ConnectionField name="database" label="Database" error={fieldErrors.database} autoComplete="off" maxLength={255} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ConnectionField name="user" label="User" error={fieldErrors.user} autoComplete="off" maxLength={255} />
            <ConnectionField name="password" label="Password (optional)" error={fieldErrors.password} type="password" autoComplete="off" maxLength={255} />
          </div>
        </TabsContent>
        <TabsContent value={DatabaseConnectionMode.URL} className="flex flex-col gap-2 pt-3">
          <ConnectionField
            name="connectionString"
            label="Connection string"
            hint="Add ?sslmode=require for databases that need SSL."
            error={fieldErrors.connectionString}
            type="password"
            autoComplete="off"
            placeholder="postgresql://user:password@host:5432/database"
            maxLength={2048}
          />
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Connects read-only and counts the rows of every table the user can read. The connection is stored encrypted to re-run the analysis.
      </p>
    </fieldset>
  );
}

interface ConnectionFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  hint?: string;
  error?: string;
}

function ConnectionField({ name, label, hint, error, ...props }: ConnectionFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={[hint && `${name}-hint`, `${name}-error`].filter(Boolean).join(' ')} {...props} />
      {hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
