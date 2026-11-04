'use client';

import { AnalysisSchema } from '@tomato/constants';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { FieldError } from '@/shared/components/field-error';
import { PageHeader } from '@/shared/components/page-header';
import { ANALYSIS_SCHEMA_LABEL, DEFAULT_ANALYSIS_SCHEMA, analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { DatabaseSelect } from '@/modules/databases';
import { LOG_FILE_FIELD_BY_SCHEMA, MAX_LOG_FILE_SIZE } from '../analyses.constants';
import { createAnalysisSchema } from '../analyses.schemas';
import { useCreateAnalysis } from '../hooks/use-analyses';
import { LogFileInput } from './log-file-input';

interface NewAnalysisFormProps {
  branch?: string;
  schema?: AnalysisSchema;
}

const FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
  invalid: 'This value is not valid.',
  empty: 'The file is empty.',
  too_large: `The file must be at most ${MAX_LOG_FILE_SIZE / 1024 / 1024} MB.`,
  file_required: 'Attach the log file.',
};

export function NewAnalysisForm({ branch = '', schema: initialSchema = DEFAULT_ANALYSIS_SCHEMA }: NewAnalysisFormProps) {
  const router = useRouter();
  const { mutate, isPending, error: requestError } = useCreateAnalysis();
  const [schema, setSchema] = useState<AnalysisSchema>(initialSchema);
  const [databaseId, setDatabaseId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isDatabase = schema === AnalysisSchema.DATABASE;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = {
      ...Object.fromEntries(
        [...form.entries()].filter(([, value]) => !(value instanceof File && value.size === 0 && value.name === '')),
      ),
      schema,
      ...(isDatabase ? { databaseId } : {}),
    };
    const parsed = createAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map(({ path, message }) => [String(path[0]), FIELD_ERRORS[message] ?? FIELD_ERRORS.invalid])));
      return;
    }
    setFieldErrors({});
    mutate(parsed.data, { onSuccess: ({ id }) => router.push(`/analyses/${id}/issues`) });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="New analysis" description="Upload a log file or pick a database to analyse a branch. Results appear once processing finishes.">
        <Breadcrumbs entries={[{ label: 'Branches', href: '/branches' }, { label: 'New analysis' }]} />
      </PageHeader>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-2">
          <Label htmlFor="branch">Branch</Label>
          <Input id="branch" name="branch" defaultValue={branch} placeholder="feat/my-branch" maxLength={255} aria-invalid={Boolean(fieldErrors.branch)} aria-describedby="branch-error" required />
          <FieldError id="branch-error" message={fieldErrors.branch} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="schema">Schema</Label>
          <Select value={schema} onValueChange={(value) => setSchema(value as AnalysisSchema)}>
            <SelectTrigger id="schema" className="w-40" aria-invalid={Boolean(fieldErrors.schema)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analysisSchemaValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {ANALYSIS_SCHEMA_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Release 1.2 — checkout refactor" maxLength={255} aria-invalid={Boolean(fieldErrors.title)} aria-describedby="title-error" required />
          <FieldError id="title-error" message={fieldErrors.title} />
        </div>
        {schema === AnalysisSchema.DATABASE ? (
          <DatabaseSelect value={databaseId} onChange={setDatabaseId} error={fieldErrors.databaseId} />
        ) : (
          <LogFileInput key={schema} field={LOG_FILE_FIELD_BY_SCHEMA[schema]} error={fieldErrors[LOG_FILE_FIELD_BY_SCHEMA[schema].name]} />
        )}
        {requestError ? <ErrorState error={requestError} /> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? (isDatabase ? 'Connecting…' : 'Uploading…') : 'Run analysis'}
          </Button>
          <Button type="button" variant="ghost" intent="neutral" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
