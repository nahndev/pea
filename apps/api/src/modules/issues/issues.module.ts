import { Module } from '@nestjs/common';
import { SubjectsModule } from '../subjects/subjects.module';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

@Module({
  imports: [SubjectsModule],
  providers: [IssuesService, IssuesRepository],
  exports: [IssuesService],
})
export class IssuesModule {}
