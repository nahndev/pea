import { Module } from '@nestjs/common';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

@Module({
  providers: [IssuesService, IssuesRepository],
  exports: [IssuesService],
})
export class IssuesModule {}
