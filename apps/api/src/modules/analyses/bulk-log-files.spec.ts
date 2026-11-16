import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { groupBulkLogFiles } from './bulk-log-files';

const upload = (fieldname: string) => ({ fieldname, originalname: 'a.log' }) as Express.Multer.File;

const responseOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return (error as BadRequestException).getResponse();
  }
  throw new Error('expected an error');
};

describe('groupBulkLogFiles', () => {
  it('groups the uploads by item index and log field', () => {
    const api = upload('analyses[0][api_metric]');
    const bug = upload('analyses[2][bug_log]');

    expect(groupBulkLogFiles([api, bug], 3)).toEqual([{ api_metric: [api] }, {}, { bug_log: [bug] }]);
  });

  it.each(['api_metric', 'analyses[0][other]', 'analyses[3][api_metric]'])('rejects the unexpected field %p', (fieldname) => {
    expect(responseOf(() => groupBulkLogFiles([upload(fieldname)], 3))).toEqual({
      code: ErrorCode.BAD_REQUEST,
      details: { [fieldname]: ['whitelistValidation'] },
    });
  });

  it('rejects two files for the same item field', () => {
    const files = [upload('analyses[1][bug_log]'), upload('analyses[1][bug_log]')];

    expect(responseOf(() => groupBulkLogFiles(files, 2))).toEqual({
      code: ErrorCode.LOG_FILE_DUPLICATED,
      details: { 'analyses.1.bug_log': [ErrorCode.LOG_FILE_DUPLICATED] },
    });
  });
});
