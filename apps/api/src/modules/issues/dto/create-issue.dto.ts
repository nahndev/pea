import { IssueStatus } from '@tomato/constants';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateIssueDto {
  @IsUUID()
  ruleId: string;

  @IsUUID()
  analysisContextId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(Object.values(IssueStatus))
  status?: IssueStatus;
}
