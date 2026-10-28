import { Module } from '@nestjs/common';
import { AnalysisContextsModule } from '../analysis-contexts/analysis-contexts.module';
import { MergeRequestsModule } from '../merge-requests/merge-requests.module';
import { AnalysesController } from './analyses.controller';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

@Module({
  imports: [MergeRequestsModule, AnalysisContextsModule],
  controllers: [AnalysesController],
  providers: [AnalysesService, AnalysesRepository],
})
export class AnalysesModule {}
