import { FileUploader } from '@/shared/components/file-uploader';
import { LOG_FILE_ACCEPT, MAX_LOG_FILE_SIZE } from '@/shared/lib/log-file.constants';
import type { LOG_FILE_FIELD_BY_SCHEMA } from '../analyses.constants';

interface LogFileInputProps {
  field: (typeof LOG_FILE_FIELD_BY_SCHEMA)[keyof typeof LOG_FILE_FIELD_BY_SCHEMA];
  value?: File;
  onChange: (file?: File) => void;
  error?: string;
  disabled?: boolean;
}

export function LogFileInput({ field: { name, label, hint }, ...props }: LogFileInputProps) {
  return (
    <FileUploader
      id={name}
      label={label}
      accept={LOG_FILE_ACCEPT}
      maxSize={MAX_LOG_FILE_SIZE}
      hint={hint}
      {...props}
    />
  );
}
