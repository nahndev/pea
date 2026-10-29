'use client';

import { Button, buttonVariants, Input, Label } from '@tomato/ui';
import { DownloadIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { useConvertSlowApi } from '../hooks/use-leaneo-slow-api-convert';
import { MAX_FILE_SIZE, OUTPUT_FILE_NAME } from '../leaneo-slow-api-convert.constants';
import { convertSlowApiSchema } from '../leaneo-slow-api-convert.schemas';

const FIELD_ERRORS: Record<string, string> = {
  file_required: 'Attach the slow_api.log file.',
  empty: 'The file is empty.',
  too_large: `The file must be at most ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
};

interface Download {
  href: string;
  converted: number;
  skipped: number;
}

export function LeaneoSlowApiConvertForm() {
  const { mutate, isPending, error: requestError, reset } = useConvertSlowApi();
  const [fieldError, setFieldError] = useState<string>();
  const [download, setDownload] = useState<Download>();

  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.href);
  }, [download]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get('file');
    const parsed = convertSlowApiSchema.safeParse({ file: file instanceof File && file.name === '' ? undefined : file });
    setDownload(undefined);
    reset();
    if (!parsed.success) {
      setFieldError(FIELD_ERRORS[parsed.error.issues[0].message] ?? FIELD_ERRORS.file_required);
      return;
    }
    setFieldError(undefined);
    mutate(parsed.data, {
      onSuccess: ({ blob, converted, skipped }) => setDownload({ href: URL.createObjectURL(blob), converted, skipped }),
    });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-2">
          <Label htmlFor="file">Slow API log</Label>
          <Input id="file" name="file" type="file" accept=".log,.json,.jsonl,.ndjson,.txt" aria-invalid={Boolean(fieldError)} aria-describedby="file-hint file-error" />
          <p id="file-hint" className="text-xs text-muted-foreground">
            JSON Lines with context.request.url, context.request.method and context.elapsedMilleSecond on each line.
          </p>
          <p id="file-error" role={fieldError ? 'alert' : undefined} className="min-h-0 text-xs text-danger empty:hidden">
            {fieldError}
          </p>
        </div>
        {requestError ? <ErrorState title="Unable to convert the file" error={requestError} /> : null}
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Converting…' : 'Convert'}
          </Button>
        </div>
      </form>
      {download ? (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-6 shadow-card" aria-live="polite">
          <p className="text-sm">
            Converted <span className="font-medium tabular-nums">{download.converted}</span> lines
            {download.skipped > 0 ? (
              <>
                , skipped <span className="font-medium tabular-nums">{download.skipped}</span> invalid lines
              </>
            ) : null}
            .
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={download.href} download={OUTPUT_FILE_NAME} className={buttonVariants({ size: 'sm' })}>
              <DownloadIcon />
              Download {OUTPUT_FILE_NAME}
            </a>
            <Link href="/analyses/new" className="text-sm underline focus-ring rounded-sm">
              Use it as the API metric log in a new analysis
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
