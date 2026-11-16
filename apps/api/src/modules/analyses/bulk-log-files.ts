import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { LogFileField } from './analyses.constants';
import type { UploadedLogFiles } from './analyses.types';

const FIELD_PATTERN = new RegExp(`^analyses\\[(\\d+)\\]\\[(${Object.values(LogFileField).join('|')})\\]$`);

/** Groups `analyses[i][<log field>]` uploads by item index */
export function groupBulkLogFiles(uploads: Express.Multer.File[], count: number): UploadedLogFiles[] {
  const groups: UploadedLogFiles[] = Array.from({ length: count }, () => ({}));
  for (const upload of uploads) {
    const match = FIELD_PATTERN.exec(upload.fieldname);
    const index = Number(match?.[1]);
    if (!match || index >= count)
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, details: { [upload.fieldname]: ['whitelistValidation'] } });
    const field = match[2] as LogFileField;
    if (groups[index][field])
      throw new BadRequestException({
        code: ErrorCode.LOG_FILE_DUPLICATED,
        details: { [`analyses.${index}.${field}`]: [ErrorCode.LOG_FILE_DUPLICATED] },
      });
    groups[index][field] = [upload];
  }
  return groups;
}
