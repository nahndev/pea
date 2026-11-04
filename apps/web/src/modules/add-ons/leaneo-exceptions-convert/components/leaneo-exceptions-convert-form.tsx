'use client';

import { Button, buttonVariants } from '@tomato/ui';
import { DownloadIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ErrorState } from '@/shared/components/error-state';
import { FileUploader } from '@/shared/components/file-uploader';
import { LOG_FILE_ACCEPT, LOG_FILE_ERRORS, MAX_LOG_FILE_SIZE } from '@/shared/lib/log-file.constants';
import { useConvertExceptions } from '../hooks/use-leaneo-exceptions-convert';
import { OUTPUT_FILE_NAME } from '../leaneo-exceptions-convert.constants';
import { convertExceptionsSchema } from '../leaneo-exceptions-convert.schemas';

const FIELD_ERRORS: Record<string, string> = {
  ...LOG_FILE_ERRORS,
  file_required: 'Attach the exceptions.log file.',
};

interface Download {
  href: string;
  converted: number;
  skipped: number;
}

export function LeaneoExceptionsConvertForm() {
  const { mutate, isPending, error: requestError, reset } = useConvertExceptions();
  const [file, setFile] = useState<File>();
  const [fieldError, setFieldError] = useState<string>();
  const [download, setDownload] = useState<Download>();

  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.href);
  }, [download]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = convertExceptionsSchema.safeParse({ file });
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
        <FileUploader
          id="file"
          label="Exceptions log"
          accept={LOG_FILE_ACCEPT}
          maxSize={MAX_LOG_FILE_SIZE}
          value={file}
          onChange={(next) => {
            setFile(next);
            setFieldError(undefined);
          }}
          hint="Monolog JSON Lines with message, level_name, channel, datetime and context.exception on each line. Personal data (request, user, IP) is dropped."
          error={fieldError}
          disabled={isPending}
        />
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
            <Link href="/analyses/new?schema=BUG" className="text-sm underline focus-ring rounded-sm">
              Use it as the bug log in a new analysis
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
