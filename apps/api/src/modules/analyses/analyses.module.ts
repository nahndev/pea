import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { BranchesModule } from '../branches/branches.module';
import { BranchAnalysesController } from './branch-analyses.controller';
import { AnalysesController } from './analyses.controller';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';

@Module({
  imports: [BranchesModule, FilesModule],
  controllers: [AnalysesController, BranchAnalysesController],
  providers: [AnalysesService, AnalysesRepository],
  exports: [AnalysesService],
})
export class AnalysesModule {}
