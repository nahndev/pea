import { Module } from '@nestjs/common';
import { MergeRequestsRepository } from './merge-requests.repository';
import { MergeRequestsService } from './merge-requests.service';

@Module({
  providers: [MergeRequestsService, MergeRequestsRepository],
  exports: [MergeRequestsService],
})
export class MergeRequestsModule {}
