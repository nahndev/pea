import { Module } from '@nestjs/common';
import { AnalysisContextsRepository } from './analysis-contexts.repository';
import { AnalysisContextsService } from './analysis-contexts.service';
import { LogStorageService } from './log-storage.service';

@Module({
  providers: [AnalysisContextsService, AnalysisContextsRepository, LogStorageService],
  exports: [AnalysisContextsService, LogStorageService],
})
export class AnalysisContextsModule {}
