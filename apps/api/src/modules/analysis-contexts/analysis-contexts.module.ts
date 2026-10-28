import { Module } from '@nestjs/common';
import { AnalysisContextsRepository } from './analysis-contexts.repository';
import { AnalysisContextsService } from './analysis-contexts.service';

@Module({
  providers: [AnalysisContextsService, AnalysisContextsRepository],
  exports: [AnalysisContextsService],
})
export class AnalysisContextsModule {}
