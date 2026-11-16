import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { ReposController } from './repos.controller';
import { ReposRepository } from './repos.repository';
import { ReposService } from './repos.service';

@Module({
  imports: [FilesModule],
  controllers: [ReposController],
  providers: [ReposService, ReposRepository],
  exports: [ReposService],
})
export class ReposModule {}
