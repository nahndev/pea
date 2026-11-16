import { Module } from '@nestjs/common';
import { AddOnsModule } from '../add-ons/add-ons.module';
import { FilesModule } from '../files/files.module';
import { ReposModule } from '../repos/repos.module';
import { DatabaseConnectionsModule } from '../database-connections/database-connections.module';
import { DatabasesModule } from '../databases/databases.module';
import { RepoAnalysesController } from './repo-analyses.controller';
import { AnalysesController } from './analyses.controller';
import { AnalysisBulkController } from './analysis-bulk.controller';
import { AnalysisContextFactory } from './analysis-context.factory';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

@Module({
  imports: [AddOnsModule, ReposModule, FilesModule, DatabaseConnectionsModule, DatabasesModule],
  controllers: [AnalysesController, AnalysisBulkController, RepoAnalysesController],
  providers: [AnalysesService, AnalysesRepository, AnalysisContextFactory],
  exports: [AnalysesService, AnalysisContextFactory],
})
export class AnalysesModule {}
