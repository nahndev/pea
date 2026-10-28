import { IssueStatus } from '@tomato/constants';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateIssueDto {
  @IsUUID()
  ruleId: string;

  @IsUUID()
  analysisContextId: string;

  @IsOptional()
  @IsIn(Object.values(IssueStatus))
  status?: IssueStatus;
}
