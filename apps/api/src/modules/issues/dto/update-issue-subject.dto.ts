import { IssueSubjectStatus } from '@tomato/constants';
import { IsIn } from 'class-validator';

export class UpdateIssueSubjectDto {
  @IsIn(Object.values(IssueSubjectStatus))
  status: IssueSubjectStatus;
}
