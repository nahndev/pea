import { Module } from '@nestjs/common';
import { SubjectsModule } from '../subjects/subjects.module';
import { IssueSubjectsController } from './issue-subjects.controller';
import { IssueSubjectsRepository } from './issue-subjects.repository';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

@Module({
  imports: [SubjectsModule],
  controllers: [IssueSubjectsController],
  providers: [IssuesService, IssuesRepository, IssueSubjectsRepository],
  exports: [IssuesService],
})
export class IssuesModule {}
