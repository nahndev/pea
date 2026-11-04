import { Input, Label } from '@tomato/ui';
import Link from 'next/link';
import { FieldError } from '@/shared/components/field-error';
import type { LOG_FILE_FIELD_BY_SCHEMA } from '../analyses.constants';

interface LogFileInputProps {
  field: (typeof LOG_FILE_FIELD_BY_SCHEMA)[keyof typeof LOG_FILE_FIELD_BY_SCHEMA];
  error?: string;
}

export function LogFileInput({ field: { name, label, hint, converter }, error }: LogFileInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="file" accept=".json,.jsonl,.ndjson,.log,.txt" aria-invalid={Boolean(error)} aria-describedby={`${name}-hint ${name}-error`} />
      <p id={`${name}-hint`} className="text-xs text-muted-foreground">
        {hint} Convert a {converter.source} with{' '}
        <Link href={converter.href} className="underline focus-ring rounded-sm">
          {converter.label}
        </Link>
        .
      </p>
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
