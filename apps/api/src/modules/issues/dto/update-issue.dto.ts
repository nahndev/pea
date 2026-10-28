import { IssueStatus } from '@tomato/constants';
import { IsIn } from 'class-validator';

export class UpdateIssueDto {
  @IsIn(Object.values(IssueStatus))
  status: IssueStatus;
}
