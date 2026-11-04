'use client';

import { Button, cn, Label } from '@tomato/ui';
import { FileIcon, UploadIcon, XIcon } from 'lucide-react';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { formatFileSize } from '@/shared/lib/format';
import { FieldError } from './field-error';

interface FileUploaderProps {
  id: string;
  label: string;
  accept: string;
  maxSize: number;
  value?: File;
  onChange: (file?: File) => void;
  hint?: ReactNode;
  error?: string;
  disabled?: boolean;
}

export function FileUploader({ id, label, accept, maxSize, value, onChange, hint, error, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const dragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const [file] = event.dataTransfer.files;
    if (!disabled && file) onChange(file);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onChange(undefined);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        onDragEnter={dragOver}
        onDragOver={dragOver}
        onDragLeave={dragLeave}
        onDrop={drop}
        className={cn(
          'relative rounded-md border border-dashed transition-colors has-focus-visible:border-primary',
          isDragging && 'border-primary bg-muted',
          error && 'border-danger',
          disabled && 'opacity-50',
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0])}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint ${id}-error`}
          className="sr-only"
        />
        {value ? (
          <div className="flex items-center gap-3 p-3">
            <FileIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{value.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatFileSize(value.size)}</span>
            </div>
            <Button type="button" variant="ghost" intent="neutral" size="icon-sm" onClick={clear} disabled={disabled} aria-label={`Remove ${value.name}`}>
              <XIcon />
            </Button>
          </div>
        ) : (
          <label htmlFor={id} className={cn('flex flex-col items-center gap-1 px-6 py-8 text-center', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <UploadIcon className="mb-1 size-5 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">{isDragging ? 'Drop the file to upload' : 'Drag & drop a file here, or click to browse'}</span>
            <span className="text-xs text-muted-foreground">
              {accept.split(',').join(', ')} · up to {formatFileSize(maxSize)}
            </span>
          </label>
        )}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
