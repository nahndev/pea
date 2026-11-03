import { BadRequestException } from '@nestjs/common';
import { IssueSubjectStatus } from '@tomato/constants';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { UpdateIssueSubjectDto } from './update-issue-subject.dto';

describe('UpdateIssueSubjectDto', () => {
  const pipe = createValidationPipe();
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: UpdateIssueSubjectDto });

  it('accepts a known status', async () => {
    await expect(validate({ status: IssueSubjectStatus.PLANNING })).resolves.toEqual({ status: IssueSubjectStatus.PLANNING });
  });

  it('rejects a missing or unknown status', async () => {
    await expect(validate({})).rejects.toBeInstanceOf(BadRequestException);
    await expect(validate({ status: 'DONE' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
