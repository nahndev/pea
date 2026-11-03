import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { BranchesModule } from '../branches/branches.module';
import { DatabaseConnectionsModule } from '../database-connections/database-connections.module';
import { DatabasesModule } from '../databases/databases.module';
import { BranchAnalysesController } from './branch-analyses.controller';
import { AnalysesController } from './analyses.controller';
import { AnalysisContextFactory } from './analysis-context.factory';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

@Module({
  imports: [BranchesModule, FilesModule, DatabaseConnectionsModule, DatabasesModule],
  controllers: [AnalysesController, BranchAnalysesController],
  providers: [AnalysesService, AnalysesRepository, AnalysisContextFactory],
  exports: [AnalysesService, AnalysisContextFactory],
})
export class AnalysesModule {}
